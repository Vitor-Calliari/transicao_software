from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.contrib.auth.models import User
import csv
from django.http import HttpResponse
from .models import Cliente 


# -----------------------------
# VIEWS HTML (SITE)
# -----------------------------

def home(request):
    return render(request, 'home.html')

def login_view(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        senha = request.POST.get('password')

        try:
            user_obj = User.objects.get(email=email)
            user = authenticate(request, username=user_obj.username, password=senha)

            if user:
                auth_login(request, user)
                return redirect('dashboard')
            else:
                messages.error(request, 'Email ou senha incorretos.')
        except User.DoesNotExist:
            messages.error(request, 'Email ou senha incorretos.')

    return render(request, 'login.html')

def logout_view(request):
    auth_logout(request)
    return redirect('login')

@login_required(login_url='login')
def dashboard_view(request):
    return render(request, 'dashboard.html')

@login_required(login_url='login')
def perfil_view(request):
    return render(request, 'perfil.html')

@login_required(login_url='login')
def clientes_view(request):
    return render(request, 'clientes.html')

@login_required(login_url='login')
def fornecedores_view(request):
    return render(request, 'fornecedores.html')

@login_required(login_url='login')
def funcionarios_view(request):
    return render(request, 'funcionarios.html')

@login_required(login_url='login')
def produtos_view(request):
    return render(request, 'produtos.html')

@login_required(login_url='login')
def vendas_view(request):
    return render(request, 'vendas.html')

# -----------------------------
# API PARA CRUD DE CLIENTES
# -----------------------------

import json
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from .models import Cliente
from .forms import ClienteForm

def cliente_to_dict(cliente):
    return {
        "id": cliente.id,
        "nome": cliente.nome,
        "email": cliente.email,
        "celular": cliente.celular,
        "fixo": cliente.fixo,
        "cod": cliente.cod,
        "endereco": cliente.endereco,
        "cep": cliente.cep,
        "numero": cliente.numero,
        "uf": cliente.uf,
        "bairro": cliente.bairro,
        "cidade": cliente.cidade,
        "complemento": cliente.complemento,
        "rg": cliente.rg,
        "cpf": cliente.cpf,
        "created_at": cliente.created_at.isoformat(),
        "updated_at": cliente.updated_at.isoformat(),
    }

@require_http_methods(["GET"])
def clientes_list(request):
    clientes = Cliente.objects.order_by("cod")
    data = [cliente_to_dict(c) for c in clientes]
    return JsonResponse({"clientes": data})

@csrf_exempt
@require_http_methods(["POST"])
def cliente_create(request):
    data = json.loads(request.body.decode("utf-8"))
    form = ClienteForm(data)
    if form.is_valid():
        cliente = form.save()
        return JsonResponse({"cliente": cliente_to_dict(cliente)}, status=201)
    return JsonResponse({"errors": form.errors}, status=400)

@csrf_exempt
@require_http_methods(["PUT", "PATCH"])
def cliente_update(request, pk):
    try:
        cliente = Cliente.objects.get(pk=pk)
    except Cliente.DoesNotExist:
        return JsonResponse({"error": "Cliente not found"}, status=404)

    data = json.loads(request.body.decode("utf-8"))
    form = ClienteForm(data, instance=cliente)

    if form.is_valid():
        cliente = form.save()
        return JsonResponse({"cliente": cliente_to_dict(cliente)})

    return JsonResponse({"errors": form.errors}, status=400)

@csrf_exempt
@require_http_methods(["DELETE"])
def cliente_delete(request, pk):
    try:
        cliente = Cliente.objects.get(pk=pk)
    except Cliente.DoesNotExist:
        return JsonResponse({"error": "Cliente not found"}, status=404)

    cliente.delete()
    return JsonResponse({"deleted": True})



# -----------------------------
# API PARA CRUD DE FUNCIONÁRIOS
# -----------------------------
from .models import Funcionario
from .forms import FuncionarioForm

def funcionario_to_dict(func):
    return {
        "id": func.id,
        "nome": func.nome,
        "email": func.email,
        "celular": func.celular,
        "fixo": func.fixo,
        "cod": func.cod,
        "endereco": func.endereco,
        "cep": func.cep,
        "numero": func.numero,
        "uf": func.uf,
        "bairro": func.bairro,
        "cidade": func.cidade,
        "complemento": func.complemento,
        "rg": func.rg,
        "cpf": func.cpf,
        "created_at": func.created_at.isoformat(),
        "updated_at": func.updated_at.isoformat(),
    }


@require_http_methods(["GET"])
def funcionarios_list(request):
    funcionarios = Funcionario.objects.order_by("cod")
    data = [funcionario_to_dict(f) for f in funcionarios]
    return JsonResponse({"funcionarios": data})


@csrf_exempt
@require_http_methods(["POST"])
def funcionario_create(request):
    data = json.loads(request.body.decode("utf-8"))
    form = FuncionarioForm(data)
    if form.is_valid():
        func = form.save()
        return JsonResponse({"funcionario": funcionario_to_dict(func)}, status=201)
    return JsonResponse({"errors": form.errors}, status=400)


@csrf_exempt
@require_http_methods(["PUT", "PATCH"])
def funcionario_update(request, pk):
    try:
        func = Funcionario.objects.get(pk=pk)
    except Funcionario.DoesNotExist:
        return JsonResponse({"error": "Funcionario not found"}, status=404)

    data = json.loads(request.body.decode("utf-8"))
    form = FuncionarioForm(data, instance=func)

    if form.is_valid():
        func = form.save()
        return JsonResponse({"funcionario": funcionario_to_dict(func)})

    return JsonResponse({"errors": form.errors}, status=400)


@csrf_exempt
@require_http_methods(["DELETE"])
def funcionario_delete(request, pk):
    try:
        func = Funcionario.objects.get(pk=pk)
    except Funcionario.DoesNotExist:
        return JsonResponse({"error": "Funcionario not found"}, status=404)

    func.delete()
    return JsonResponse({"deleted": True})


# -----------------------------
# API PARA CRUD DE FORNECEDORES
# -----------------------------
from .models import Fornecedor
from .forms import FornecedorForm

def fornecedor_to_dict(forn):
    return {
        "id": forn.id,
        "nome": forn.nome,
        "email": forn.email,
        "celular": forn.celular,
        "fixo": forn.fixo,
        "cod": forn.cod,
        "endereco": forn.endereco,
        "cep": forn.cep,
        "numero": forn.numero,
        "uf": forn.uf,
        "bairro": forn.bairro,
        "cidade": forn.cidade,
        "complemento": forn.complemento,
        "cnpj": forn.cnpj,
        "created_at": forn.created_at.isoformat(),
        "updated_at": forn.updated_at.isoformat(),
    }


@require_http_methods(["GET"])
def fornecedores_list(request):
    fornecedores = Fornecedor.objects.order_by("cod")
    data = [fornecedor_to_dict(f) for f in fornecedores]
    return JsonResponse({"fornecedores": data})


@csrf_exempt
@require_http_methods(["POST"])
def fornecedor_create(request):
    data = json.loads(request.body.decode("utf-8"))
    form = FornecedorForm(data)
    if form.is_valid():
        forn = form.save()
        return JsonResponse({"fornecedor": fornecedor_to_dict(forn)}, status=201)
    return JsonResponse({"errors": form.errors}, status=400)


@csrf_exempt
@require_http_methods(["PUT", "PATCH"])
def fornecedor_update(request, pk):
    try:
        forn = Fornecedor.objects.get(pk=pk)
    except Fornecedor.DoesNotExist:
        return JsonResponse({"error": "Fornecedor not found"}, status=404)

    data = json.loads(request.body.decode("utf-8"))
    form = FornecedorForm(data, instance=forn)

    if form.is_valid():
        forn = form.save()
        return JsonResponse({"fornecedor": fornecedor_to_dict(forn)})

    return JsonResponse({"errors": form.errors}, status=400)


@csrf_exempt
@require_http_methods(["DELETE"])
def fornecedor_delete(request, pk):
    try:
        forn = Fornecedor.objects.get(pk=pk)
    except Fornecedor.DoesNotExist:
        return JsonResponse({"error": "Fornecedor not found"}, status=404)

    forn.delete()
    return JsonResponse({"deleted": True})


def exportar_clientes_csv(request):
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="clientes.csv"'

    # **** MUDANÇA CRÍTICA: Definir o delimitador como ponto e vírgula (;) ****
    writer = csv.writer(response, delimiter=';') 
    
    # Cabeçalho
    writer.writerow(['ID', 'Nome', 'Email', 'Telefone'])

    # Dados
    for cliente in Cliente.objects.all():
        # Certifique-se de que a ordem dos campos bate com o cabeçalho
        writer.writerow([cliente.id, cliente.nome, cliente.email, cliente.celular]) 
        
    return response
# API PRODUTOS
from .models import Produto
from .forms import ProdutoForm

def produto_to_dict(prod):
    return {
        "id": prod.id,
        "descricao": prod.descricao,
        "cod": prod.cod,
        "valorUnitario": float(prod.valorUnitario),
        "estoque": prod.estoque,
        "created_at": prod.created_at.isoformat(),
        "updated_at": prod.updated_at.isoformat(),
    }


@require_http_methods(["GET"])
def produtos_list(request):
    produtos = Produto.objects.order_by("cod")
    data = [produto_to_dict(p) for p in produtos]
    return JsonResponse({"produtos": data})


@csrf_exempt
@require_http_methods(["POST"])
def produto_create(request):
    data = json.loads(request.body.decode("utf-8"))
    form = ProdutoForm(data)
    if form.is_valid():
        prod = form.save()
        return JsonResponse({"produto": produto_to_dict(prod)}, status=201)
    return JsonResponse({"errors": form.errors}, status=400)


@csrf_exempt
@require_http_methods(["PUT", "PATCH"])
def produto_update(request, pk):
    try:
        prod = Produto.objects.get(pk=pk)
    except Produto.DoesNotExist:
        return JsonResponse({"error": "Produto not found"}, status=404)

    data = json.loads(request.body.decode("utf-8"))
    form = ProdutoForm(data, instance=prod)

    if form.is_valid():
        prod = form.save()
        return JsonResponse({"produto": produto_to_dict(prod)})

    return JsonResponse({"errors": form.errors}, status=400)


@csrf_exempt
@require_http_methods(["DELETE"])
def produto_delete(request, pk):
    try:
        prod = Produto.objects.get(pk=pk)
    except Produto.DoesNotExist:
        return JsonResponse({"error": "Produto not found"}, status=404)

    prod.delete()
    return JsonResponse({"deleted": True})
