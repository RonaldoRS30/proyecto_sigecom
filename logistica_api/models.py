from django.conf import settings
from django.db import models, transaction
from django.utils import timezone
from django.core.validators import MinValueValidator
from decimal import Decimal
from simple_history.models import HistoricalRecords
from django.contrib.auth.hashers import check_password, make_password
import datetime

#========================================================================================

class TipoCambio(models.Model):
    id_tcambio = models.AutoField(primary_key=True)

    fec = models.DateField(db_column='_fec')
    hor = models.CharField(max_length=10, db_column='_hor')
    com = models.DecimalField(max_digits=7, decimal_places=3, db_column='_com', null=True, blank=True)
    ven = models.DecimalField(max_digits=7, decimal_places=3, db_column='_ven', null=True, blank=True)
    obs = models.CharField(max_length=80, db_column='_obs', null=True, blank=True)
    activo = models.CharField(max_length=1, default='1')

    class Meta:
        db_table = 'cont_tcambio'
        managed = False


#========================================================================================

##=============================##
## LOGISTICA ##
##=============================##
class LogisticaDashboard(models.Model):
    # Campos principales
    num_reg = models.AutoField(primary_key=True)
    ope = models.CharField(max_length=1, blank=True, null=True) # operacion
    anno = models.CharField(max_length=4, blank=True, null=True)
    mes = models.CharField(max_length=2, blank=True, null=True)
    fec = models.DateField(blank=True, null=True) #fecha
    oco = models.CharField(max_length=100, blank=True, null=True) #ocompra
    mov = models.CharField(max_length=5, blank=True, null=True)
    tmo = models.CharField(max_length=100, blank=True, null=True)
    tc = models.DecimalField(max_digits=7, decimal_places=3, blank=True, null=True)
    cor = models.CharField(max_length=11, blank=True, null=True)
    dor = models.CharField(max_length=100, blank=True, null=True)
    tip = models.CharField(max_length=2, blank=True, null=True)
    nfa = models.CharField(max_length=13, blank=True, null=True)
    alm = models.CharField(max_length=3, blank=True, null=True)
    ngu = models.CharField(max_length=13, blank=True, null=True)
    nom1 = models.CharField(max_length=100, blank=True, null=True)
    nom2 = models.CharField(max_length=100, blank=True, null=True)
    sol = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    dol = models.DecimalField(max_digits=11, decimal_places=2, blank=True, null=True)
    reg = models.CharField(max_length=10, blank=True, null=True)
    obs = models.CharField(max_length=100, blank=True, null=True)
    anulado= models.CharField(max_length=1, blank=True, null=True)
    est = models.IntegerField(blank=True, null=True)


    class Meta:
        managed = False
        db_table = "sis_alm_mov_es"
        verbose_name = "Registro Logística"
        verbose_name_plural = "Registros Logística"
        ordering = ["-fec", "-num_reg"]

    def __str__(self):
        return f"Registro #{self.num_reg} "

# DETALLE
class LogisticaDashboardDetalle(models.Model):
    # Campos principales
    id = models.AutoField(primary_key=True)
    num_reg = models.IntegerField()
    num = models.CharField(max_length=30, blank=True, null=False) # operacion
    cod = models.CharField(max_length=70, blank=True, null=True)
    nom = models.CharField(max_length=1000, blank=True, null=True)
    um = models.CharField(max_length=10, blank=True, null=True) #fecha
    can = models.IntegerField(blank=True, null=True) #ocompra
    val = models.DecimalField(max_digits=11, decimal_places=2, blank=True, null=True)
    tot = models.DecimalField(max_digits=11, decimal_places=2, blank=True, null=True)
    sol = models.DecimalField(max_digits=11, decimal_places=2, blank=True, null=True)
    dol = models.DecimalField(max_digits=11, decimal_places=2, blank=True, null=True)
    reg = models.CharField(max_length=10, blank=True, null=True)
    obs = models.CharField(max_length=100, blank=True, null=True)
    ope = models.CharField(max_length=1, blank=True, null=True)
  
    class Meta:
        managed = False
        db_table = "sis_alm_mov_es_det"
        verbose_name = "Registro Logística"
        verbose_name_plural = "Registros Logística"
        ordering = ["-num_reg"]

    def __str__(self):
        return f"Registro #{self.num_reg} "



class AlmTabUmed(models.Model):
    cod    = models.CharField(max_length=10, primary_key=True)
    nom    = models.CharField(max_length=30, blank=True, null=True)
    abr    = models.CharField(max_length=10, blank=True, null=True)
    activo = models.CharField(max_length=1, blank=True, null=True)

    class Meta:
        managed = False
        db_table = "sis_alm_tab_umed"
        ordering = ["cod"]

    def __str__(self):
        return f"{self.cod} - {self.nom}"



# models.py

# models.py

class VcMovOrdenSoli(models.Model):
    num_reg = models.CharField(max_length=70, blank=True, null=True)
    reg     = models.AutoField(primary_key=True) #clave para CONSULTAR A LA OTRA TABLA 
    nig     = models.CharField(max_length=1, blank=True, null=True)
    cog     = models.CharField(max_length=10, blank=True, null=True)
    num     = models.IntegerField(blank=True, null=True)
    fec     = models.DateField(blank=True, null=True)
    hor     = models.CharField(max_length=10, blank=True, null=True)
    are     = models.CharField(max_length=1, blank=True, null=True)
    cod     = models.CharField(max_length=70, blank=True, null=True)
    sol     = models.CharField(max_length=60, blank=True, null=True)
    soc     = models.CharField(max_length=30, blank=True, null=True)
    des     = models.CharField(max_length=60, blank=True, null=True)
    den     = models.CharField(max_length=100)   # numero de orden de compra
    ban     = models.CharField(max_length=2, blank=True, null=True)
    cta     = models.CharField(max_length=100)   # NOT NULL
    tmo     = models.CharField(max_length=1, blank=True, null=True)
    mos     = models.DecimalField(max_digits=11, decimal_places=2, blank=True, null=True)
    tc      = models.DecimalField(max_digits=7, decimal_places=3, blank=True, null=True)
    mou     = models.DecimalField(max_digits=11, decimal_places=2, blank=True, null=True)
    con     = models.CharField(max_length=200, blank=True, null=True)
    fet     = models.DateField(blank=True, null=True)
    fel     = models.DateField(blank=True, null=True)
    obs     = models.CharField(max_length=100, blank=True, null=True)
    est     = models.CharField(max_length=1, blank=True, null=True)
    luo     = models.CharField(max_length=100, blank=True, null=True) #razón social
    lud     = models.CharField(max_length=100, blank=True, null=True)
    fes     = models.DateField(blank=True, null=True)
    hos     = models.CharField(max_length=100, blank=True, null=True)
    fef     = models.DateField(blank=True, null=True)
    hof     = models.CharField(max_length=100, blank=True, null=True)
    ndi     = models.IntegerField(blank=True, null=True)
    tot     = models.DecimalField(max_digits=11, decimal_places=2, blank=True, null=True)
    sal     = models.DecimalField(max_digits=11, decimal_places=2, blank=True, null=True)
    mov     = models.CharField(max_length=2, blank=True, null=True)
    tga     = models.CharField(max_length=2, blank=True, null=True)
    adoc    = models.CharField(max_length=100, blank=True, null=True)
    anum    = models.CharField(max_length=100, blank=True, null=True)
    afec    = models.DateField(blank=True, null=True)
    ahor    = models.CharField(max_length=10, blank=True, null=True)
    apor    = models.CharField(max_length=100, blank=True, null=True)
    aobs    = models.CharField(max_length=200, blank=True, null=True)
    aok     = models.CharField(max_length=1, blank=True, null=True)
    ddoc    = models.CharField(max_length=100, blank=True, null=True)
    dnum    = models.CharField(max_length=100, blank=True, null=True)
    dfec    = models.DateField(blank=True, null=True)
    dhor    = models.CharField(max_length=10, blank=True, null=True)
    dpor    = models.CharField(max_length=100, blank=True, null=True)
    dobs    = models.CharField(max_length=200, blank=True, null=True)
    dok     = models.CharField(max_length=1, blank=True, null=True)
    lfec    = models.DateField(blank=True, null=True)
    lmon    = models.DecimalField(max_digits=11, decimal_places=2, blank=True, null=True)
    lsal    = models.DecimalField(max_digits=11, decimal_places=2, blank=True, null=True)
    rdoc    = models.CharField(max_length=100, blank=True, null=True)
    rnum    = models.DecimalField(max_digits=11, decimal_places=2, blank=True, null=True)
    rfec    = models.DateField(blank=True, null=True)
    rhor    = models.CharField(max_length=10, blank=True, null=True)
    rpor    = models.CharField(max_length=100, blank=True, null=True)
    robs    = models.CharField(max_length=100, blank=True, null=True)
    rok     = models.CharField(max_length=1, blank=True, null=True)
    idoc    = models.CharField(max_length=100, blank=True, null=True)
    inum    = models.DecimalField(max_digits=11, decimal_places=2, blank=True, null=True)
    ifec    = models.DateField(blank=True, null=True)
    ihor    = models.CharField(max_length=10, blank=True, null=True)
    ipor    = models.CharField(max_length=100, blank=True, null=True)
    iobs    = models.CharField(max_length=200, blank=True, null=True)
    iok     = models.CharField(max_length=1, blank=True, null=True)
    iigv    = models.DecimalField(max_digits=11, decimal_places=2, blank=True, null=True)
    tmos    = models.DecimalField(max_digits=11, decimal_places=2, blank=True, null=True)
    recf    = models.DateField(blank=True, null=True)
    rece    = models.CharField(max_length=1, blank=True, null=True, default='0')
    usu     = models.CharField(max_length=30, blank=True, null=True)
    aprf    = models.DateField(blank=True, null=True)
    apro    = models.CharField(max_length=1, blank=True, null=True, default='0')
    aprd    = models.CharField(max_length=100, blank=True, null=True)
    guia    = models.IntegerField(blank=True, null=True, default=0)
    guiae   = models.CharField(max_length=1, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'vc_mov_orden_soli'

    def __str__(self):
        return self.den

class VcMovOrdenSoliD(models.Model):
    reg  = models.IntegerField(primary_key=True)        # FK lógico hacia VcMovOrdenSoli.reg
    num  = models.IntegerField()         # N° de ítem
    cod  = models.CharField(max_length=100, blank=True, null=True)
    nom  = models.CharField(max_length=1000, blank=True, null=True)
    obs  = models.CharField(max_length=50, blank=True, null=True)
    can  = models.IntegerField(blank=True, null=True)
    val  = models.DecimalField(max_digits=11, decimal_places=3, blank=True, null=True)
    tot  = models.DecimalField(max_digits=11, decimal_places=3, blank=True, null=True)
    alm  = models.CharField(max_length=1, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'vc_mov_orden_soli_d'
        unique_together = ('reg', 'num')

    def __str__(self):
        return f'{self.reg}-{self.num} {self.nom}'



#========================================================================================


##================##
## DATOS DE BD_VC ##
##================##    
# cont_cias
class cont_cias(models.Model):
    cod = models.CharField(primary_key=True, max_length=10)  # clave primaria real (ej. "001")
    anno = models.IntegerField(default=timezone.now().year)

    class Meta:
        db_table = "cont_cias"
        managed = False

# vc_tab_rittal
class vc_tab_rittal(models.Model):
    codigo = models.CharField(max_length=10, primary_key=True)  # Código del cliente o registro
    nombre = models.CharField(max_length=100, blank=True, null=True)
    grupo = models.CharField(max_length=5, blank=True, null=True)
    um = models.CharField(max_length=10, blank=True, null=True)
    descripcion = models.CharField(max_length=100, blank=True, null=True)
    precio_s = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    precio_d = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    cantidad = models.DecimalField(max_digits=9, decimal_places=2, blank=True, null=True)
    ocodigo = models.CharField(max_length=15, blank=True, null=True)
    stock_min = models.DecimalField(max_digits=9, decimal_places=2, blank=True, null=True)
    stock_max = models.DecimalField(max_digits=9, decimal_places=2, blank=True, null=True)
    descuento = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    proveedor = models.CharField(max_length=70, blank=True, null=True)
    activo = models.BooleanField(default=True)  # Indicador de activo/inactivo

    class Meta:
        managed = False
        db_table = "vc_tab_rittal"
        ordering = ["codigo"]

    def __str__(self):
        return f"{self.codigo} ({self.nombre})"

# vc_tab_rockwell
class vc_tab_rockwell(models.Model):
    codigo = models.CharField(max_length=60, primary_key=True)  # Código del cliente o registro
    codigo2 = models.CharField(max_length=60, blank=True, null=True)
    descripcion = models.CharField(max_length=100, blank=True, null=True)
    ds = models.CharField(max_length=2, blank=True, null=True)
    pgc = models.CharField(max_length=3, blank=True, null=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    proveedor = models.CharField(max_length=20, blank=True, null=True)
    activo = models.BooleanField(default=True)  # Indicador de activo/inactivo
    cprimario = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    x = models.CharField(max_length=1, blank=True, null=True)

    class Meta:
        managed = False
        db_table = "vc_tab_rockwell"
        ordering = ["codigo"]

    def __str__(self):
        return f"{self.codigo} ({self.codigo2})"

# vc_tab_ceyesa
class vc_tab_ceyesa(models.Model):
    codigo = models.CharField(max_length=60, primary_key=True)  # Código del cliente o registro
    codigo2 = models.CharField(max_length=60, blank=True, null=True)
    descripcion = models.CharField(max_length=150, blank=True, null=True)
    ds = models.CharField(max_length=2, blank=True, null=True)
    pgc = models.CharField(max_length=3, blank=True, null=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    proveedor = models.CharField(max_length=20, blank=True, null=True)
    activo = models.BooleanField(default=True)  # Indicador de activo/inactivo
    cprimario = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)

    class Meta:
        managed = False
        db_table = "vc_tab_ceyesa"
        ordering = ["codigo"]

    def __str__(self):
        return f"{self.codigo} ({self.codigo2})"

# vc_tab_hoffman
class vc_tab_hoffman(models.Model):
    codigo = models.CharField(max_length=10, primary_key=True)  # Código del cliente o registro
    nombre = models.CharField(max_length=100, blank=True, null=True)
    grupo = models.CharField(max_length=5, blank=True, null=True)
    um = models.CharField(max_length=10, blank=True, null=True)
    descripcion = models.CharField(max_length=100, blank=True, null=True)
    precio_s = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    precio_d = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    cantidad = models.DecimalField(max_digits=9, decimal_places=2, blank=True, null=True)
    ocodigo = models.CharField(max_length=15, blank=True, null=True)
    stock_min = models.DecimalField(max_digits=9, decimal_places=2, blank=True, null=True)
    stock_max = models.DecimalField(max_digits=9, decimal_places=2, blank=True, null=True)
    descuento = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    proveedor = models.CharField(max_length=70, blank=True, null=True)
    activo = models.BooleanField(default=True)  # Indicador de activo/inactivo

    class Meta:
        managed = False
        db_table = "vc_tab_hoffman"
        ordering = ["codigo"]

    def __str__(self):
        return f"{self.codigo} ({self.nombre})"

# alm_articulos
class alm_articulos(models.Model):
    codigo = models.CharField(max_length=30, primary_key=True)  # Código del cliente o registro
    nombre = models.CharField(max_length=200, blank=True, null=True)
    grupo = models.CharField(max_length=5, blank=True, null=True)
    um = models.CharField(max_length=10, blank=True, null=True)
    descripcion = models.CharField(max_length=100, blank=True, null=True)
    precio_s = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    precio_d = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    cantidad = models.DecimalField(max_digits=9, decimal_places=2, blank=True, null=True)
    ocodigo = models.CharField(max_length=15, blank=True, null=True)
    stock_min = models.DecimalField(max_digits=9, decimal_places=2, blank=True, null=True)
    stock_max = models.DecimalField(max_digits=9, decimal_places=2, blank=True, null=True)
    descuento = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    proveedor = models.CharField(max_length=70, blank=True, null=True)
    activo = models.BooleanField(default=True)  # Indicador de activo/inactivo

    class Meta:
        managed = False
        db_table = "alm_articulos"
        ordering = ["codigo"]

    def __str__(self):
        return f"{self.codigo} ({self.nombre})"

# sis_alm_tab_almacen
class sis_alm_tab_almacen(models.Model):
    cod = models.CharField(max_length=3, primary_key=True)
    nom = models.CharField(max_length=50, blank=True, null=True)
    res = models.CharField(max_length=50, blank=True, null=True)
    tel = models.CharField(max_length=50, blank=True, null=True)
    dir = models.CharField(max_length=50, blank=True, null=True)
    activo = models.CharField(max_length=1, blank=True, null=True)

    class Meta:
        managed = False
        db_table = "sis_alm_tab_almacen"

    def __str__(self):
        return f"{self.cod} - {self.nom}"

# sis_alm_tab_grupo
class sis_alm_tab_grupo(models.Model):
    cod = models.CharField(max_length=12, primary_key=True)
    nom = models.CharField(max_length=150, blank=True, null=True)
    activo = models.CharField(max_length=1, blank=True, null=True)

    class Meta:
        managed = False
        db_table = "sis_alm_tab_grupo"

    def __str__(self):
        return f"{self.cod} - {self.nom}"

# sis_alm_tab_articulos
class sis_alm_tab_articulos(models.Model):
    reg = models.AutoField(primary_key=True)
    cod = models.CharField(max_length=50, blank=True, null=True)
    nom = models.CharField(max_length=500, blank=True, null=True)
    gru = models.CharField(max_length=12, blank=True, null=True, default="000")
    um = models.CharField(max_length=10, blank=True, null=True)
    det = models.CharField(max_length=100, blank=True, null=True)
    sol = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    dol = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    can = models.IntegerField(blank=True, null=True)
    min = models.IntegerField(blank=True, null=True)
    max = models.IntegerField(blank=True, null=True)
    dct = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    pro = models.CharField(max_length=70, blank=True, null=True)
    est = models.CharField(max_length=70, blank=True, null=True)
    obs = models.CharField(max_length=100, blank=True, null=True)
    ocod = models.CharField(max_length=50, blank=True, null=True)
    activo = models.CharField(max_length=1, blank=True, null=True)

    class Meta:
        managed = False
        db_table = "sis_alm_tab_articulos"
        ordering = ["reg"]

    def __str__(self):
        return f"{self.cod or self.reg} - {self.nom}"

# sis_alm_tab_ccosto
class sis_alm_tab_ccosto(models.Model):
    cod = models.CharField(max_length=10, primary_key=True)
    nom = models.CharField(max_length=32, blank=True, null=True)
    activo = models.CharField(max_length=1, blank=True, null=True, default="1")

    class Meta:
        managed = False
        db_table = "sis_alm_tab_ccosto"

    def __str__(self):
        return f"{self.cod} - {self.nom}"


# ============================
# UNIDAD DE MEDIDA  (alm_umed)
# ============================
class AlmUmed(models.Model):
    cod = models.CharField(max_length=5, primary_key=True)
    nom = models.CharField(max_length=30, blank=True, null=True)
    abr = models.CharField(max_length=10, blank=True, null=True)

    class Meta:
        managed = False
        db_table = "alm_umed"

    def __str__(self):
        return f"{self.cod} - {self.nom}"


# ============================
# DOCUMENTOS ALMACÉN  (sis_alm_tab_doc)
# ============================
class SisAlmTabDoc(models.Model):
    cod    = models.CharField(max_length=2, primary_key=True)
    nom    = models.CharField(max_length=50, blank=True, null=True)
    activo = models.CharField(max_length=1, blank=True, null=True, default="1")

    class Meta:
        managed = False
        db_table = "sis_alm_tab_doc"

    def __str__(self):
        return f"{self.cod} - {self.nom}"

