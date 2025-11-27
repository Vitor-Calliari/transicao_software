# legacysystem/decorators.py
from functools import wraps
from django.shortcuts import redirect
from django.contrib import messages
from django.http import HttpResponseForbidden
from django.contrib.auth.decorators import login_required
from .models import Funcionario

def admin_required(redirect_to_dashboard=True, use_403=False):
    """
    Decorator: permite somente usuários com nivel_acesso == 'administrador'
    - redirect_to_dashboard=True -> redireciona para 'dashboard' com mensagem de erro
    - use_403=True -> retorna HttpResponseForbidden em vez de redirecionar
    """
    def decorator(view_func):
        @wraps(view_func)
        @login_required(login_url='login')
        def _wrapped(request, *args, **kwargs):
            # superusers/staff também liberados (opcional)
            if request.user.is_superuser or request.user.is_staff:
                return view_func(request, *args, **kwargs)

            # tenta obter o Funcionario associado ao usuário
            try:
                func = request.user.funcionario  # OneToOne reverse accessor
            except Funcionario.DoesNotExist:
                func = None

            if func and func.nivel_acesso == 'administrador':
                return view_func(request, *args, **kwargs)

            # se não autorizado
            if use_403:
                return HttpResponseForbidden("Acesso negado.")
            if redirect_to_dashboard:
                messages.error(request, "Acesso negado: somente administradores têm permissão.")
                return redirect('dashboard')
            return HttpResponseForbidden("Acesso negado.")
        return _wrapped
    return decorator
