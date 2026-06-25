# logistica_api/serializers.py

from rest_framework import serializers
from django.contrib.auth import get_user_model
import uuid
from .models import (
    vc_tab_estado,
    vc_tab_categorias,
    vc_tab_tproveedor,
    vc_mov_cotizaciones,
    vc_tab_tgastos,
    vc_tab_tgastos_d,
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
# vc_tab_estado
class EstadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = vc_tab_estado
        fields = "__all__"

class ProveedoresSerializer(serializers.ModelSerializer):
    class Meta:
        model = vc_tab_tproveedor
        fields = "__all__"

# vc_mov_cotizaciones
class CotizacionesSerializer(serializers.ModelSerializer):
    # Campos derivados para mostrar nombres legibles
    cliente_nombre = serializers.SerializerMethodField()
    area_nombre = serializers.SerializerMethodField()
    estado_nombre = serializers.SerializerMethodField()

    # Exponer IDs de FK si quieres (aunque en vc_mov_cotizaciones son strings)
    cliente_id = serializers.SerializerMethodField()
    area_id = serializers.SerializerMethodField()
    estado_id = serializers.SerializerMethodField()

    class Meta:
        model = vc_mov_cotizaciones
        fields = [
            "cotif",
            "cotin",
            "refer",
            "empre",
            "nombr",
            "area",
            "estad",
            "tot_c",
            "cliente_id",
            "cliente_nombre",
            "area_id",
            "area_nombre",
            "estado_id",
            "estado_nombre",
        ]

    # --------------------------
    # Métodos para campos legibles
    # --------------------------
    def get_cliente_nombre(self, obj):
        return obj.get_cliente_nombre()

    def get_area_nombre(self, obj):
        return obj.get_area_nombre()

    def get_estado_nombre(self, obj):
        return obj.get_estado_nombre()

    # --------------------------
    # Métodos para exponer los "IDs" de las relaciones
    # --------------------------
    def get_cliente_id(self, obj):
        return obj.empre

    def get_area_id(self, obj):
        return obj.area

    def get_estado_id(self, obj):
        return obj.estad

# vc_tab_categorias
class CategoriasSerializer(serializers.ModelSerializer):
    class Meta:
        model = vc_tab_categorias
        fields = "__all__"

# vc_tab_tgastos
class TGastosSerializer(serializers.ModelSerializer):
    class Meta:
        model = vc_tab_tgastos
        fields = "__all__"

# vc_tab_tgastos_d
class TGastosDSerializer(serializers.ModelSerializer):
    class Meta:
        model = vc_tab_tgastos_d
        fields = "__all__"

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