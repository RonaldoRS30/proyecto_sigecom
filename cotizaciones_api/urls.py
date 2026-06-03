# proyecto_cotizaciones/cotizaciones_api/urls.py

from django.urls import path, include, re_path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import views
from cotizaciones_api.views_frontend import FrontendAppView

# Registramos ViewSets en el router
router = DefaultRouter()
# router.register(r'cotizaciones', views.CotizacionViewSet, basename='cotizaciones')
# router.register(r'aprobaciones', views.AprobacionCotizacionViewSet, basename='aprobaciones')

urlpatterns = [
    # CSRF
    path('csrf/', views.get_csrf_token, name='get_csrf_token'),

    # COTIZACIONES
    path('lista_cotizaciones/', views.lista_cotizaciones, name="lista_cotizaciones"),
    path('lista_aperturas/', views.lista_aperturas, name='lista_aperturas'),
    path('cotizacion_detalle/<int:id_registro>/', views.cotizacion_detalle, name='cotizacion_detalle'),
    path('ultima_cotizacion_cliente/<int:id_cliente>/', views.ultima_cotizacion_cliente, name='ultima_cotizacion_cliente'),
    path('lista_suministros/<int:id_registro>/', views.listar_suministros, name='listar_suministros'),
    path("lista_servicios/<int:id_registro>/", views.listar_servicios, name="listar_servicios"),
    path('adjuntos/<int:id_registro>/', views.gestionar_adjuntos, name='gestionar_adjuntos'),
    path('mensajes/<int:id_registro>/', views.gestionar_mensajes, name='gestionar_mensajes'),
    path("seguimientos/<int:id_registro>/", views.listar_seguimientos, name="listar_seguimiento"),


    path("cotizaciones/<int:num_reg>/totales-descuento/", views.totales_descuento_view, name="totales_descuento"),
    path("cotizaciones/<int:num_reg>/recalcular-totales/", views.recalcular_totales_cotizacion, name="recalcular_totales_cotizacion"),

    # OPORTUNIDADES
    path('lista_oportunidades/', views.lista_oportunidades, name='lista_oportunidades'),
    path('siguiente_num_reg_oportunidad/', views.siguiente_num_reg_oportunidad_view, name='siguiente_num_reg_oportunidad'),
    #path('cotizaciones/oportunidades', views.oportunidades_dashboard_view, name="oportunidades_dashboard_view"),
    #path('oportunidades/modal/<str:num_reg>/', views.oportunidad_detalle_view, name='oportunidad_detalle_view'),
    
    

    # BUSQUEDA
    path('core/clientes/<str:empresa>/encargados/', views.buscar_encargados_por_empresa, name='buscar_encargados_por_empresa'),

    # GESTION
    #path("cotizaciones/<str:num_reg>/condiciones-generales/", views.condiciones_generales, name="condiciones_generales"),
    path("condiciones-generales/<int:id_registro>/", views.condiciones_generales, name="condiciones_generales"),
    #path("cotizaciones/<str:numero>/generar-codigo/", views.generar_codigo_view, name="generar_codigo"),
    #path("cotizaciones/generar_codigo/<str:num_reg>/", views.generar_codigo_cotizacion, name="generar_codigo_cotizacion"),
    path("generar-codigo/<int:id_registro>/", views.generar_codigo_cotizacion, name="generar_codigo_cotizacion"),
    path("nueva-version/<int:id_registro>/", views.crear_nueva_version_cotizacion, name="nueva-version"),
    path("cotizaciones/<str:num_reg>/asignar-regus/", views.asignar_regus, name="asignar_regus"),
    path("cotizaciones/<int:id_registro>/generar-copia/", views.generar_copiar_cotizacion, name="generar_copiar_cotizacion"),
    path("eliminar/<int:id_registro>/", views.eliminar_cotizacion, name="eliminar_cotizacion"),
    #path("cotizaciones/<int:num_reg>/enviar-aprobacion/", views.enviar_cotizacion_aprobacion, name="enviar_cotizacion_aprobacion"),
    path("enviar-aprobacion/<int:id_registro>/", views.enviar_cotizacion_aprobacion, name="enviar_cotizacion_aprobacion"),
    path("cotizaciones/<int:num_reg>/cambiar-estado/", views.cambiar_estado_cotizacion, name="cambiar_estado_cotizacion"),
    path("cotizaciones/<int:num_reg>/retornar/", views.retornar_cotizacion, name="retornar_cotizacion"),
    path("cotizaciones/<str:num_reg>/pdf-context/", views.cotizacion_pdf_context, name="cotizacion_pdf_context"),
    path("cotizaciones/<str:num_reg>/pdf-preview/", views.cotizacion_pdf_preview, name="cotizacion_pdf_preview"),
    path("cotizaciones/<str:num_reg>/pdf/", views.cotizacion_pdf, name="cotizacion_pdf",),
    path('cotizaciones/<str:num_reg>/reporte-html/', views.cotizacion_reporte_html, name='cotizacion_reporte_html'),
    path('cotizacion/word/<str:num_reg>/', views.descargar_cotizacion_word, name='descargar_cotizacion_word'),
    path("cotizaciones/<str:num_reg>/descuento/", views.descuento_cotizacion, name="obtener_descuento_cotizacion"),

    # OBJETIVOS
    path("dashboard/objetivos/", views.objetivos_anuales, name="objetivos_anuales"),
    path("dashboard/logrado/", views.logrado_dashboard, name="logrado_dashboard"),
    path("dashboard/kpis/", views.kpis_dashboard, name="kpis_dashboard"),
    path("dashboard/tendencias/", views.tendencias_dashboard, name="tendencias_dashboard"),
    path("dashboard/analisis/", views.cotizaciones_analisis_view, name="cotizaciones-analisis"),

    # NOTIFICACIONES
    path("notificaciones/", views.notificaciones_usuario, name="notificaciones_usuario"),
    path("notificaciones/<int:pk>/marcar/", views.marcar_notificacion, name="marcar_notificacion"),
    path("notificaciones/marcar-todas/", views.marcar_todas_notificaciones, name="marcar_todas_notificaciones"),
    path("notificaciones/no-leidas/", views.notificaciones_no_leidas, name="notificaciones_no_leidas"),

    # ALERTAS
    path("alertas/generar/", views.generar_alertas, name="generar_alertas"),

    # DB_VC
    path("cotizaciones/rittal/", views.lista_rittal, name="lista_rittal"),
    path("cotizaciones/rockwell/", views.lista_rockwell, name="lista_rockwell"),
    path("cotizaciones/ceyesa/", views.lista_ceyesa, name="lista_ceyesa"),
    path("cotizaciones/hoffman/", views.lista_hoffman, name="lista_hoffman"),
    path("cotizaciones/alm-articulos/", views.lista_alm_articulos, name="lista_alm_articulos"),

    # GUARDAR COTIZACIÓN
    path("cotizaciones/guardar/", views.guardar_cotizacion, name="guardar_cotizacion"),

    # REPORTES
    path("cotizaciones/reportes/reporte_cotizaciones_dashboard_html/", views.reporte_cotizaciones_dashboard_html, name="reporte_cotizaciones_dashboard_html"),
    path('reporte-suministros-html/<int:id_registro>/', views.reporte_suministros_html, name='reporte_suministros_html'),
    path('reporte-servicios-html/<int:id_registro>/', views.reporte_servicios_html, name='reporte_servicios_html'),
    path("reporte-detallado/<int:id_registro>/", views.reporte_detallado_cotizacion, name="reporte_detallado_cotizacion"),
    path("reporte-resumen/<int:id_registro>/", views.reporte_resumen_cotizacion, name="reporte_resumen_cotizacion"),
    path("cotizaciones/reportes/reporte_venta_total/<str:num_reg>/", views.reporte_venta_total_html, name="reporte_venta_total_html"),
    path("cotizaciones/reportes/reporte_venta_parcial/<str:num_reg>/", views.reporte_venta_parcial_html, name="reporte_venta_parcial_html"),

    # SEGUIMIENTO DE COTIZACIONES
    # path("dashboard/seguimiento-cotizaciones/", views.lista_seguimiento_cotizaciones, name="lista_seguimiento_cotizaciones"),

    # Todas las rutas de ViewSets bajo /api/
    path('', include(router.urls)),

]
