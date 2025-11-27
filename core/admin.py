from django.contrib import admin
from legacysystem.models import Cliente


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ("nome", "cod", "email", "celular", "cpf")
    search_fields = ("nome", "cod", "cpf")
    list_filter = ("created_at", "updated_at")