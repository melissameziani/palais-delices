from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import transaction
from .models import Commande, LigneCommande
from .serializers import (
    CommandeSerializer, CommandeCreateSerializer, CommandeWithLignesSerializer,
    LigneCommandeSerializer, LigneCommandeDetailSerializer
)

class CommandeViewSet(viewsets.ModelViewSet):
    """ViewSet pour la gestion des commandes"""
    serializer_class = CommandeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtrer les commandes par utilisateur (sauf admin)"""
        if self.request.user.role == 'admin':
            return Commande.objects.all().select_related('user').prefetch_related('lignes__plat')
        return Commande.objects.filter(user=self.request.user).select_related('user').prefetch_related('lignes__plat')
    
    def get_serializer_class(self):
        """Choisir le bon serializer selon l'action"""
        if self.action == 'create':
            return CommandeCreateSerializer
        elif self.action == 'retrieve':
            return CommandeWithLignesSerializer
        return CommandeSerializer
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Créer une nouvelle commande avec ses lignes"""
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            # Créer la commande
            commande = serializer.save()
            
            # Réponse avec la commande créée
            response_serializer = CommandeWithLignesSerializer(commande, context={'request': request})
            
            return Response({
                'success': True,
                'message': 'Commande créée avec succès !',
                'commande': response_serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Mettre à jour le statut d'une commande (admin uniquement)"""
        if request.user.role != 'admin':
            return Response({
                'success': False,
                'error': 'Permission refusée'
            }, status=status.HTTP_403_FORBIDDEN)
        
        commande = self.get_object()
        new_status = request.data.get('statut')
        
        if new_status not in dict(Commande.STATUT_CHOICES):
            return Response({
                'success': False,
                'error': 'Statut invalide'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        old_status = commande.statut
        commande.statut = new_status
        commande.save()
        
        return Response({
            'success': True,
            'message': f'Statut mis à jour de "{old_status}" vers "{new_status}"',
            'commande': CommandeSerializer(commande, context={'request': request}).data
        })
    
    @action(detail=True, methods=['post'])
    def cancel_order(self, request, pk=None):
        """Annuler une commande"""
        commande = self.get_object()
        
        # Vérifier que l'utilisateur peut annuler cette commande
        if commande.user != request.user and request.user.role != 'admin':
            return Response({
                'success': False,
                'error': 'Permission refusée'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Vérifier que la commande peut être annulée
        if commande.statut in ['delivered', 'cancelled']:
            return Response({
                'success': False,
                'error': f'Impossible d\'annuler une commande "{commande.get_statut_display()}"'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        commande.statut = 'cancelled'
        commande.save()
        
        return Response({
            'success': True,
            'message': 'Commande annulée avec succès',
            'commande': CommandeSerializer(commande, context={'request': request}).data
        })
    
    @action(detail=False, methods=['get'])
    def my_orders(self, request):
        """Récupérer les commandes de l'utilisateur connecté"""
        commandes = self.get_queryset().filter(user=request.user)
        serializer = CommandeWithLignesSerializer(commandes, many=True, context={'request': request})
        
        return Response({
            'success': True,
            'commandes': serializer.data,
            'total': commandes.count()
        })
    
    @action(detail=False, methods=['get'])
    def order_stats(self, request):
        """Statistiques des commandes (admin uniquement)"""
        if request.user.role != 'admin':
            return Response({
                'success': False,
                'error': 'Permission refusée'
            }, status=status.HTTP_403_FORBIDDEN)
        
        from django.db.models import Count, Sum
        from django.utils import timezone
        from datetime import timedelta
        
        today = timezone.now().date()
        this_week = today - timedelta(days=7)
        this_month = today.replace(day=1)
        
        stats = {
            'total_commandes': Commande.objects.count(),
            'commandes_aujourd_hui': Commande.objects.filter(dateCommande__date=today).count(),
            'commandes_semaine': Commande.objects.filter(dateCommande__date__gte=this_week).count(),
            'commandes_mois': Commande.objects.filter(dateCommande__date__gte=this_month).count(),
            'chiffre_affaires_mois': Commande.objects.filter(
                dateCommande__date__gte=this_month,
                statut__in=['confirmed', 'preparing', 'ready', 'delivered']
            ).aggregate(total=Sum('montant'))['total'] or 0,
            'commandes_par_statut': dict(
                Commande.objects.values('statut').annotate(count=Count('id')).values_list('statut', 'count')
            )
        }
        
        return Response({
            'success': True,
            'stats': stats
        })

class LigneCommandeViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet pour consulter les lignes de commande"""
    serializer_class = LigneCommandeDetailSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filtrer par utilisateur (sauf admin)"""
        if self.request.user.role == 'admin':
            return LigneCommande.objects.all().select_related('commande', 'plat')
        return LigneCommande.objects.filter(commande__user=self.request.user).select_related('commande', 'plat')
