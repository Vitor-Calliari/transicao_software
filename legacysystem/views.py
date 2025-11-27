from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.hashers import make_password
from django.contrib import messages
from django.contrib.auth.models import User
from django.db.models import Sum, F
from django.utils import timezone
from django.http import HttpResponse
import csv 

from .models import Cliente, Produto, Venda, Funcionario, Fornecedor
from django.db.models.functions import ExtractMonth
import json 


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
    clientes_count = Cliente.objects.count()
    produtos_estoque_total = Produto.objects.aggregate(total=Sum('estoque'))['total'] or 0
    
    now = timezone.now()
    current_year = now.year
    current_month = now.month
    
    # gafico dashboard
    sales_by_month = Venda.objects.filter(data_venda__year=current_year).annotate(month=ExtractMonth('data_venda')).values('month').annotate(total=Sum('valor_final')).order_by('month')
    months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    sales_data = [0] * 12
    for sale in sales_by_month:
        sales_data[sale['month'] - 1] = float(sale['total'])
    
    # Mês anterior
    last_month = current_month - 1
    last_year = current_year
    if last_month == 0:
        last_month = 12
        last_year -= 1
    
    vendas_mes = Venda.objects.filter(
        data_venda__year=current_year,
        data_venda__month=current_month
    ).aggregate(total=Sum('valor_final'))['total'] or 0
    vendas_mes_formatado = f"R$ {vendas_mes:,.2f}".replace('.', ',').replace(',', '.', 1).replace(',', ',')
    
    fornecedores_count = Fornecedor.objects.count()
    funcionarios_count = Funcionario.objects.count()
    produtos_estoque_baixo = Produto.objects.filter(estoque__lt=10).count()
    
    # Novos clientes no mês atual
    novos_clientes_mes = Cliente.objects.filter(
        created_at__year=current_year,
        created_at__month=current_month
    ).count()
    
    # Novos clientes no mês anterior
    novos_clientes_last_month = Cliente.objects.filter(
        created_at__year=last_year,
        created_at__month=last_month
    ).count()
    
    # Status clientes
    clientes_status = 'verde' if novos_clientes_mes > novos_clientes_last_month else 'vermelho'
    clientes_seta = 'cima' if novos_clientes_mes > novos_clientes_last_month else 'baixo'
    
    # Vendas no mês anterior
    vendas_last_month = Venda.objects.filter(
        data_venda__year=last_year,
        data_venda__month=last_month
    ).aggregate(total=Sum('valor_final'))['total'] or 0
    
    # Status vendas
    vendas_status = 'verde' if vendas_mes > vendas_last_month else 'vermelho'
    vendas_seta = 'cima' if vendas_mes > vendas_last_month else 'baixo'
    
    vendas_total_count = Venda.objects.count()
    
    # Últimos registros
    eventos = []
    modelos = [
        (Cliente, 'Cliente'),
        (Funcionario, 'Funcionário'),
        (Fornecedor, 'Fornecedor'),
        (Produto, 'Produto'),
        (Venda, 'Venda'),
    ]
    
    for model, name in modelos:
        # Adicionados
        for obj in model.objects.order_by('-created_at')[:10]:
            acao = f'{name} adicionado' if name != 'Venda' else 'Venda realizada'
            eventos.append({
                'acao': acao,
                'id': getattr(obj, 'cod', obj.id),
                'hora': obj.created_at.strftime('%H:%M'),
                'data': obj.created_at
            })
        # Alterados
        for obj in model.objects.filter(updated_at__gt=F('created_at')).order_by('-updated_at')[:10]:
            acao = f'{name} ajustado'
            eventos.append({
                'acao': acao,
                'id': getattr(obj, 'cod', obj.id),
                'hora': obj.updated_at.strftime('%H:%M'),
                'data': obj.updated_at
            })
    
    eventos.sort(key=lambda x: x['data'], reverse=True)
    ultimos_registros = eventos[:5]
    
    context = {
        'clientes_count': clientes_count,
        'produtos_estoque_total': produtos_estoque_total,
        'vendas_mes_formatado': vendas_mes_formatado,
        'fornecedores_count': fornecedores_count,
        'funcionarios_count': funcionarios_count,
        'produtos_estoque_baixo': produtos_estoque_baixo,
        'novos_clientes_mes': novos_clientes_mes,
        'clientes_status': clientes_status,
        'clientes_seta': clientes_seta,
        'vendas_total_count': vendas_total_count,
        'vendas_status': vendas_status,
        'vendas_seta': vendas_seta,
        'ultimos_registros': ultimos_registros,
        'sales_data_json': json.dumps(sales_data),
        'months_json': json.dumps(months),
        'current_year': current_year,
    }
    return render(request, 'dashboard.html', context)

@login_required(login_url='login')
def perfil_view(request):
    user = request.user
    try:
        funcionario = Funcionario.objects.get(email=user.email)
        context = {
            'user': user,
            'funcionario': funcionario,
        }
    except Funcionario.DoesNotExist:
        context = {
            'user': user,
        }
    return render(request, 'perfil.html', context)

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

    if "senha" in data and data["senha"].strip():
        data["senha"] = make_password(data["senha"])

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
    if "senha" in data and data["senha"].strip():
        data["senha"] = make_password(data["senha"])

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


# -----------------------------
# API PARA CRUD DE VENDAS
# -----------------------------
from django.db import transaction
from .models import Venda, ItemVenda
from .forms import VendaForm, ItemVendaForm

def venda_to_dict(venda):
    return {
        "id": venda.id,
        "cliente_id": venda.cliente.id,
        "cliente_nome": venda.cliente.nome,
        "data_venda": venda.data_venda.isoformat(),
        "forma_pagamento": venda.forma_pagamento,
        "valor_total": float(venda.valor_total),
        "desconto": float(venda.desconto),
        "valor_final": float(venda.valor_final),
        "status": venda.status,
        "itens": [item_to_dict(item) for item in venda.itens.all()],
        "created_at": venda.created_at.isoformat(),
        "updated_at": venda.updated_at.isoformat(),
    }

def item_to_dict(item):
    return {
        "id": item.id,
        "produto_id": item.produto.id,
        "produto_descricao": item.produto.descricao,
        "produto_cod": item.produto.cod,
        "quantidade": item.quantidade,
        "valor_unitario": float(item.valor_unitario),
        "subtotal": float(item.subtotal),
    }


@require_http_methods(["GET"])
def vendas_list(request):
    vendas = Venda.objects.select_related('cliente').prefetch_related('itens__produto').order_by('-data_venda', '-id')
    data = [venda_to_dict(v) for v in vendas]
    return JsonResponse({"vendas": data})


@csrf_exempt
@require_http_methods(["POST"])
def venda_create(request):
    try:
        data = json.loads(request.body.decode("utf-8"))
        
        # Validar dados da venda
        venda_data = {
            'cliente': data.get('cliente_id'),
            'data_venda': data.get('data_venda'),
            'forma_pagamento': data.get('forma_pagamento', 'Dinheiro'),
            'desconto': data.get('desconto', 0),
            'status': data.get('status', 'Concluída'),
        }
        
        venda_form = VendaForm(venda_data)
        if not venda_form.is_valid():
            return JsonResponse({"errors": venda_form.errors}, status=400)
        
        # Validar itens
        itens_data = data.get('itens', [])
        if not itens_data:
            return JsonResponse({"error": "A venda deve ter pelo menos um item"}, status=400)
        
        # Validar estoque antes de criar a venda
        erros_estoque = []
        for item_data in itens_data:
            produto_id = item_data.get('produto_id')
            quantidade = int(item_data.get('quantidade', 0))
            
            try:
                produto = Produto.objects.get(id=produto_id)
                if produto.estoque < quantidade:
                    erros_estoque.append(
                        f"Produto '{produto.descricao}' possui apenas {produto.estoque} unidade(s) em estoque. Solicitado: {quantidade}"
                    )
            except Produto.DoesNotExist:
                return JsonResponse({"error": f"Produto com ID {produto_id} não encontrado"}, status=404)
        
        if erros_estoque:
            return JsonResponse({"error": "Estoque insuficiente", "detalhes": erros_estoque}, status=400)
        
        # Criar venda e itens em uma transação
        with transaction.atomic():
            venda = venda_form.save()
            
            for item_data in itens_data:
                produto_id = item_data.get('produto_id')
                quantidade = int(item_data.get('quantidade'))
                valor_unitario = float(item_data.get('valor_unitario'))
                
                produto = Produto.objects.select_for_update().get(id=produto_id)
                
                # Criar item da venda
                ItemVenda.objects.create(
                    venda=venda,
                    produto=produto,
                    quantidade=quantidade,
                    valor_unitario=valor_unitario
                )
                
                # Diminuir estoque
                produto.estoque -= quantidade
                produto.save()
            
            # Calcular totais
            venda.calcular_totais()
        
        return JsonResponse({"venda": venda_to_dict(venda)}, status=201)
        
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
@require_http_methods(["PUT", "PATCH"])
def venda_update(request, pk):
    try:
        venda = Venda.objects.get(pk=pk)
    except Venda.DoesNotExist:
        return JsonResponse({"error": "Venda not found"}, status=404)
    
    try:
        data = json.loads(request.body.decode("utf-8"))
        
        # Atualizar apenas campos permitidos (não permite alterar itens após criação)
        venda.forma_pagamento = data.get('forma_pagamento', venda.forma_pagamento)
        venda.desconto = float(data.get('desconto', venda.desconto))
        venda.status = data.get('status', venda.status)
        
        # Recalcular valor final com novo desconto
        venda.valor_final = venda.valor_total - venda.desconto
        venda.save()
        
        return JsonResponse({"venda": venda_to_dict(venda)})
        
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@require_http_methods(["GET"])
def venda_detail(request, pk):
    try:
        venda = Venda.objects.select_related('cliente').prefetch_related('itens__produto').get(pk=pk)
        return JsonResponse({"venda": venda_to_dict(venda)})
    except Venda.DoesNotExist:
        return JsonResponse({"error": "Venda not found"}, status=404)

@csrf_exempt
@login_required(login_url='login')
def change_password(request):
    if request.method == 'POST':
        old_password = request.POST.get('old_password')
        new_password = request.POST.get('new_password')
        confirm_password = request.POST.get('confirm_password')
        
        user = request.user
        if not user.check_password(old_password):
            return JsonResponse({'error': 'Senha antiga incorreta'}, status=400)
        
        if new_password != confirm_password:
            return JsonResponse({'error': 'As senhas não coincidem'}, status=400)
        
        if len(new_password) < 8:
            return JsonResponse({'error': 'A nova senha deve ter pelo menos 8 caracteres'}, status=400)
        
        user.set_password(new_password)
        user.save()
        return JsonResponse({'success': 'Senha alterada com sucesso'})
    
    return JsonResponse({'error': 'Método não permitido'}, status=405)
