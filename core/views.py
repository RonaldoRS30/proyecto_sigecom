from django.shortcuts import render

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from rest_framework.decorators import api_view, parser_classes, permission_classes, action, authentication_classes
from .models import (
    Cliente,
    Representante,
    Estado,
    TipoGasto,
    TipoMarca,
    TipoPersonal,
    TipoGastoDetalle,
    Producto,
    Nota,
)
from .serializers import (
    ClienteSerializer,
    RepresentanteSerializer,
    EstadoSerializer,
    TipoGastoSerializer,
    TipoMarcaSerializer,
    TipoPersonalSerializer,
    TipoGastoDetalleSerializer,
    ProductoSerializer,
    NotaSerializer,
)

# CLIENTE
@api_view(["GET", "POST", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def lista_clientes(request):
    # 1. GET:
    if request.method == "GET":
        id_cliente = request.query_params.get("id_cliente")
        if id_cliente:
            try:
                cliente = Cliente.objects.get(pk=id_cliente)
                serializer = ClienteSerializer(cliente)
                return Response(serializer.data)
            except Cliente.DoesNotExist:
                return Response({"error": "Cliente no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        clientes = Cliente.objects.all() 
        serializer = ClienteSerializer(clientes, many=True)
        return Response(serializer.data)

    # 2. POST:
    elif request.method == "POST":
        serializer = ClienteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Empresa registrada correctamente",
                "data": serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # 3. PUT:
    elif request.method == "PUT":
        codigo = request.data.get("id_cliente")
        try:
            cliente = Cliente.objects.get(pk=codigo)
            serializer = ClienteSerializer(cliente, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({
                    "message": "Empresa actualizada correctamente",
                    "data": serializer.data
                }, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Cliente.DoesNotExist:
            return Response({"error": "Empresa no encontrada"}, status=status.HTTP_404_NOT_FOUND)

    # 4. DELETE:
    elif request.method == "DELETE":
        codigo = request.data.get("id_cliente") or request.query_params.get("id_cliente")
        
        if not codigo:
             return Response({"error": "Debe proporcionar el código"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            cliente = Cliente.objects.get(pk=codigo)
            cliente.delete()
            return Response({"message": "Empresa eliminada correctamente"}, status=status.HTTP_200_OK)
        except Cliente.DoesNotExist:
            return Response({"error": "Empresa no encontrada"}, status=status.HTTP_404_NOT_FOUND)
        except Exception:
            return Response({"error": "No se puede eliminar: el registro tiene datos asociados"}, status=status.HTTP_400_BAD_REQUEST)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def buscar_clientes_inline(request):
    try:
        # 1. Obtener parámetro de búsqueda
        query = request.query_params.get('q', '').strip()
        
        # 2. Filtrar solo activos
        # OJO: Usamos 'activo="1"' porque en tu modelo es CharField
        clientes_qs = Cliente.objects.filter(activo="1")
        
        # 3. Búsqueda multi-campo
        if query:
            clientes_qs = clientes_qs.filter(
                Q(nombre__icontains=query) | 
                Q(ruc__icontains=query) |
                Q(id_cliente__icontains=query) # AutoField permite icontains en Django
            )
        
        # 4. Selección de campos y límite
        # Traemos solo lo necesario para el buscador de cotizaciones
        resultados = clientes_qs.order_by('nombre').values('id_cliente', 'nombre', 'ruc', 'iniciales', 'tipo')[:20]
        
        return Response(list(resultados), status=status.HTTP_200_OK)

    except Exception as e:
        # Esto imprimirá el error real en tu consola de Django para que lo veas
        print(f"❌ Error en buscar_clientes_inline: {str(e)}")
        return Response(
            {"error": "Error interno al buscar clientes", "detail": str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# REPRESENTANTES
@api_view(["GET", "POST", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def lista_representantes(request):
    
    # 1. GET: Listar todos o filtrar por ID
    if request.method == "GET":
        id_representante = request.query_params.get("id_representante")
        if id_representante:
            try:
                rep = Representante.objects.get(pk=id_representante)
                serializer = RepresentanteSerializer(rep)
                return Response(serializer.data)
            except Representante.DoesNotExist:
                return Response({"error": "Representante no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        representantes = Representante.objects.all()
        serializer = RepresentanteSerializer(representantes, many=True)
        return Response(serializer.data)
    
    # 2. POST: Registro
    elif request.method == "POST":
        serializer = RepresentanteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Representante registrado correctamente",
                "data": serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # 3. PUT: Actualizar
    elif request.method == "PUT":
        # Usamos el nuevo nombre de la PK
        pk_id = request.data.get("id_representante")
        try:
            representante = Representante.objects.get(pk=pk_id)
            serializer = RepresentanteSerializer(representante, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({
                    "message": "Representante actualizado correctamente",
                    "data": serializer.data
                }, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Representante.DoesNotExist:
            return Response({"error": "Representante no encontrado"}, status=status.HTTP_404_NOT_FOUND)

    # 4. DELETE: Eliminar
    elif request.method == "DELETE":
        pk_id = request.data.get("id_representante") or request.query_params.get("id_representante")
        
        if not pk_id:
            return Response({"error": "Debe proporcionar el ID del representante"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            representante = Representante.objects.get(pk=pk_id)
            representante.delete()
            return Response({"message": "Representante eliminado correctamente"}, status=status.HTTP_200_OK)
        except Representante.DoesNotExist:
            return Response({"error": "Representante no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": f"Error al eliminar: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def buscar_representantes_inline(request):
    try:
        # cliente_id ahora es el ID entero de la tabla clientes
        cliente_id = request.query_params.get('cliente_id', '').strip()
        query = request.query_params.get('q', '').strip()

        if not cliente_id:
            return Response([], status=status.HTTP_200_OK)

        # Filtramos por la relación ForeignKey y que el representante esté activo (1)
        qs = Representante.objects.filter(id_cliente=cliente_id, activo=1)

        if query:
            qs = qs.filter(nombre_representante__icontains=query)

        # Retornamos los datos necesarios para el autocompletado
        resultados = qs.order_by('nombre_representante').values(
            'id_representante', 
            'nombre_representante',
            'cargo', 
            'telefono', 
            'movil', 
            'email'
        )[:20]

        return Response(list(resultados), status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ESTADOS
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def lista_estados(request):
    """
    Lista los estados activos para las cotizaciones.
    En SIGECOM 5, filtramos por activo=1.
    """
    # Filtramos por activo=1 (equivalente al antiguo activo=True)
    # Ya no usamos el filtro 'cot=1' porque no existe en la nueva tabla
    estados = Estado.objects.filter(activo=1).order_by("nombre")
    
    serializer = EstadoSerializer(estados, many=True)
    return Response(serializer.data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def lista_tipo_gasto(request):
    tipo_gasto = TipoGasto.objects.filter(activo="1").order_by("codigo")
    serializer = TipoGastoSerializer(tipo_gasto, many=True)
    return Response(serializer.data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def lista_tipo_marca(request):
    tipo_marca = TipoMarca.objects.filter(activo="1").order_by("nombre")
    serializer = TipoMarcaSerializer(tipo_marca, many=True)
    return Response(serializer.data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def lista_tipo_personal(request):
    """
    Lista todos los tipos de personal activos para SIGECOM 5.
    """
    try:
        personal = TipoPersonal.objects.select_related('id_area').filter(activo=1)
        
        serializer = TipoPersonalSerializer(personal, many=True)
        return Response({
            "ok": True,
            "data": serializer.data
        })
        
    except Exception as e:
        return Response({
            "ok": False,
            "error": str(e)
        }, status=500)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def lista_tgasto_detalle(request):
    """
    Lista el detalle de tipos de gasto activos para SIGECOM 5.
    """
    try:
        # Usamos select_related para traer el nombre del padre en una sola consulta
        detalles = TipoGastoDetalle.objects.select_related('id_tipo_gasto').filter(activo=1)
        
        serializer = TipoGastoDetalleSerializer(detalles, many=True)
        return Response({
            "ok": True,
            "data": serializer.data
        })
        
    except Exception as e:
        return Response({
            "ok": False,
            "error": str(e)
        }, status=500)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def lista_productos(request):
    """
    Lista todos los productos activos. 
    Soporta búsqueda opcional mediante el parámetro 'search' e 'id_marca'.
    """
    try:
        search = request.query_params.get('search', None)
        id_marca = request.query_params.get('id_marca', None)
        
        # Optimizamos con select_related para traer marca y unidad de medida
        productos = Producto.objects.select_related('id_marca', 'id_medida').filter(activo=1)
        
        if id_marca:
            productos = productos.filter(id_marca=id_marca)
            
        if search:
            productos = productos.filter(
                Q(nombre__icontains=search) | 
                Q(codigo__icontains=search) |
                Q(ocodigo__icontains=search)
            )
        
        # Limitamos a los primeros 100 para no saturar si no hay búsqueda
        if not search:
            productos = productos[:100]

        serializer = ProductoSerializer(productos, many=True)
        return Response({
            "ok": True,
            "data": serializer.data
        })
        
    except Exception as e:
        return Response({
            "ok": False,
            "error": str(e)
        }, status=500)

@api_view(["GET", "POST", "PUT"])
@permission_classes([IsAuthenticated])
def lista_notas(request):
    # --- GET: Listar todas las notas activas ---
    if request.method == "GET":
        try:
            notas = Nota.objects.filter(activo=1).order_by("codigo")
            serializer = NotaSerializer(notas, many=True)
            return Response({
                "ok": True,
                "data": serializer.data
            })
        except Exception as e:
            return Response({"ok": False, "error": str(e)}, status=500)
    
    # --- POST: Crear una nueva nota ---
    elif request.method == "POST":
        serializer = NotaSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "ok": True, 
                "data": serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response({"ok": False, "errors": serializer.errors}, status=400)

    # --- PUT: Actualizar nota por id_nota ---
    elif request.method == "PUT":
        id_nota = request.data.get("id_nota")
        try:
            nota = Nota.objects.get(pk=id_nota)
            serializer = NotaSerializer(nota, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({
                    "ok": True,
                    "data": serializer.data
                })
            return Response({"ok": False, "errors": serializer.errors}, status=400)
        except Nota.DoesNotExist:
            return Response({
                "ok": False, 
                "error": "Nota técnica no encontrada"
            }, status=404)

