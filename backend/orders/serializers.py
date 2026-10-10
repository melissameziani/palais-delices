from rest_framework import serializers
from .models import Commande, LigneCommande
from authentication.serializers import UtilisateurSerializer
from menu.serializers import PlatSerializer
from restaurant.serializers import TableSerializer

class LigneCommandeSerializer(serializers.ModelSerializer):
    """Serializer pour les lignes de commande"""
    plat_nom = serializers.CharField(source='plat.nom', read_only=True)
    plat_prix = serializers.DecimalField(source='plat.prix', max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = LigneCommande
        fields = [
            'id', 'plat', 'plat_nom', 'plat_prix', 'quantite',
            'prixUnitaire', 'sousTotal', 'commentaire'
        ]
        read_only_fields = ['id', 'sousTotal']
    
    def validate_quantite(self, value):
        if value <= 0:
            raise serializers.ValidationError("La quantité doit être positive.")
        return value

class CommandeSerializer(serializers.ModelSerializer):
    """Serializer pour les commandes"""
    user_nom = serializers.CharField(source='user.get_full_name', read_only=True)
    table_numero = serializers.CharField(source='table.numero', read_only=True)
    total_items = serializers.SerializerMethodField()
    
    class Meta:
        model = Commande
        fields = [
            'id', 'numero_commande', 'user', 'user_nom', 'table', 'table_numero',
            'dateCommande', 'statut', 'montant', 'fraisLivraison',
            'modeLivraison', 'modePaiement', 'adresseLivraison',
            'telephoneContact', 'commentaire', 'total_items', 'created_at'
        ]
        read_only_fields = ['id', 'numero_commande', 'created_at']
    
    def get_total_items(self, obj):
        return obj.total_items

class CommandeWithLignesSerializer(CommandeSerializer):
    """Serializer commande avec ses lignes"""
    lignes = LigneCommandeSerializer(many=True, read_only=True)
    
    class Meta(CommandeSerializer.Meta):
        fields = CommandeSerializer.Meta.fields + ['lignes']

class CommandeCreateSerializer(serializers.ModelSerializer):
    """Serializer pour créer une commande"""
    lignes = LigneCommandeSerializer(many=True)
    
    class Meta:
        model = Commande
        fields = [
            'table', 'modeLivraison', 'modePaiement',
            'adresseLivraison', 'telephoneContact', 'commentaire', 'lignes'
        ]
    
    def create(self, validated_data):
        lignes_data = validated_data.pop('lignes')
        validated_data['user'] = self.context['request'].user
        
        commande = Commande.objects.create(**validated_data)
        
        total_montant = 0
        for ligne_data in lignes_data:
            ligne = LigneCommande.objects.create(commande=commande, **ligne_data)
            total_montant += ligne.sousTotal
        
        commande.montant = total_montant
        commande.save()
        
        return commande

class LigneCommandeDetailSerializer(LigneCommandeSerializer):
    """Serializer détaillé pour une ligne de commande"""
    plat = PlatSerializer(read_only=True)
    
    class Meta(LigneCommandeSerializer.Meta):
        fields = LigneCommandeSerializer.Meta.fields + ['plat']