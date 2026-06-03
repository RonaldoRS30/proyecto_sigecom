# logistica_api/serializers.py

from rest_framework import serializers
from django.contrib.auth import get_user_model
import uuid
from .models import (
    vc_tab_rittal,
    vc_tab_rockwell,
    vc_tab_ceyesa,
    vc_tab_hoffman,
    alm_articulos,
    sis_alm_tab_almacen,
    cont_cias,
    sis_alm_tab_grupo,
    sis_alm_tab_articulos,
    AlmTabUmed,
    sis_alm_tab_ccosto,
)
from django.contrib.auth import get_user_model
from django.utils.timezone import localtime
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from decimal import Decimal
from datetime import timezone

User = get_user_model()

#========================================================================================

from .models import VcMovOrdenSoli

class OrdenOCSerializer(serializers.ModelSerializer):
    codigo  = serializers.CharField(source='den')
    cliente = serializers.CharField(source='luo')
    moneda  = serializers.CharField(source='tmo')  # ✅
    tcambio = serializers.DecimalField(source='tc', max_digits=7, decimal_places=3)
    monto_soles   = serializers.DecimalField(source='mos', max_digits=15, decimal_places=2)
    monto_dolares = serializers.DecimalField(source='mou', max_digits=11, decimal_places=2)

    class Meta:
        model = VcMovOrdenSoli
        fields = [
            'reg',
            'codigo',
            'cliente',
            'moneda',
            'tcambio',
            'monto_soles',
            'monto_dolares',
        ]


# Token Perzonalizado para login
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Reemplazamos el identificador por usuario
        token['user_id'] = user.usuario

        # Agregamos datos útiles al token
        token['nombre'] = user.nombre_completo or ''
        token['area'] = user.area or ''
        token['cargo'] = user.cargo or ''
        token['banco'] = user.ban or ''
        token['cuenta'] = user.banc or ''

        return token

#========================================================================================

##================##
## DATOS DE BD_VC ##
##================##

# vc_tab_rittal
class RittalSerializer(serializers.ModelSerializer):
    class Meta:
        model = vc_tab_rittal
        fields = "__all__"

# vc_tab_rockwell
class RockwellSerializer(serializers.ModelSerializer):
    class Meta:
        model = vc_tab_rockwell
        fields = "__all__"

# vc_tab_ceyesa
class CeyesaSerializer(serializers.ModelSerializer):
    class Meta:
        model = vc_tab_ceyesa
        fields = "__all__"

# vc_tab_hoffman
class HoffmanSerializer(serializers.ModelSerializer):
    class Meta:
        model = vc_tab_hoffman
        fields = "__all__"

# alm_articulos
class AlmArticulosSerializer(serializers.ModelSerializer):
    class Meta:
        model = alm_articulos
        fields = "__all__"

# cont_cias
class ContCiasSerializer(serializers.ModelSerializer):
    class Meta:
        model = cont_cias
        fields = "__all__"

# sis_alm_tab_almacen
class AlmacenSerializer(serializers.ModelSerializer):
    class Meta:
        model = sis_alm_tab_almacen
        fields = "__all__"

# AlmTabUmed
class AlmTabUmedSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlmTabUmed
        fields = "__all__"

# sis_alm_tab_grupo
class GrupoAnaliticoSerializer(serializers.ModelSerializer):
    class Meta:
        model = sis_alm_tab_grupo
        fields = "__all__"

# sis_alm_tab_articulos
class ArticuloSerializer(serializers.ModelSerializer):
    # Opcional: podrías incluir nombres de grupo y um si lo deseas
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        # Limpiar valores null o strings vacíos si es necesario
        return representation

    class Meta:
        model = sis_alm_tab_articulos
        fields = "__all__"

# sis_alm_tab_ccosto
class CcostoSerializer(serializers.ModelSerializer):
    class Meta:
        model = sis_alm_tab_ccosto
        fields = "__all__"
