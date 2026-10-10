from rest_framework import serializers
from .models import Table, Reservation
from authentication.serializers import UtilisateurSerializer

class TableSerializer(serializers.ModelSerializer):
    """Serializer pour les tables"""
    is_available = serializers.SerializerMethodField()
    
    class Meta:
        model = Table
        fields = ['id', 'numero', 'nbPlaces', 'position', 'disponible', 'is_available', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_is_available(self, obj):
        """Vérifier si la table est disponible pour une date/heure donnée"""
        # Logique à implémenter selon vos besoins
        return obj.disponible

class ReservationSerializer(serializers.ModelSerializer):
    """Serializer pour les réservations"""
    user_nom = serializers.CharField(source='user.get_full_name', read_only=True)
    table_numero = serializers.CharField(source='table.numero', read_only=True)
    
    class Meta:
        model = Reservation
        fields = [
            'id', 'user', 'user_nom', 'table', 'table_numero',
            'dateReservation', 'heureReservation', 'nbPersonnes',
            'statut', 'commentaire', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def validate(self, attrs):
        """Validation personnalisée"""
        date_reservation = attrs.get('dateReservation')
        heure_reservation = attrs.get('heureReservation')
        table = attrs.get('table')
        
        # Vérifier que la date n'est pas dans le passé
        from django.utils import timezone
        from datetime import datetime, time
        
        if date_reservation:
            reservation_datetime = datetime.combine(date_reservation, heure_reservation or time(12, 0))
            if reservation_datetime < timezone.now():
                raise serializers.ValidationError("Impossible de réserver dans le passé.")
        
        # Vérifier la disponibilité de la table
        if table and not table.disponible:
            raise serializers.ValidationError("Cette table n'est pas disponible.")
        
        return attrs

class ReservationCreateSerializer(ReservationSerializer):
    """Serializer pour créer une réservation"""
    
    def create(self, validated_data):
        # Assigner l'utilisateur connecté
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class ReservationDetailSerializer(ReservationSerializer):
    """Serializer détaillé pour une réservation"""
    user = UtilisateurSerializer(read_only=True)
    table = TableSerializer(read_only=True)
    
    class Meta(ReservationSerializer.Meta):
        fields = ReservationSerializer.Meta.fields + ['user', 'table']