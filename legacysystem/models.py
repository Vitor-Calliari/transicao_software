from django.db import models
from django.db.models import Max
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

NIVEL_ACESSO_CHOICES = [
    ('administrador', 'Administrador'),
    ('funcionario', 'Funcionário'),
]

class Cliente(models.Model):
    nome = models.CharField(max_length=200)
    email = models.EmailField(blank=True, null=True)
    celular = models.CharField(max_length=20, blank=True, null=True)
    fixo = models.CharField(max_length=20, blank=True, null=True)
    cod = models.PositiveIntegerField(unique=True, blank=True)
    endereco = models.CharField(max_length=255, blank=True, null=True)
    cep = models.CharField(max_length=20, blank=True, null=True)
    numero = models.CharField(max_length=20, blank=True, null=True)
    uf = models.CharField(max_length=5, blank=True, null=True)
    bairro = models.CharField(max_length=100, blank=True, null=True)
    cidade = models.CharField(max_length=100, blank=True, null=True)
    complemento = models.CharField(max_length=100, blank=True, null=True)
    rg = models.CharField(max_length=30, blank=True, null=True)
    cpf = models.CharField(max_length=20, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.cod:
            max_cod = Cliente.objects.aggregate(Max('cod'))['cod__max'] or 0
            self.cod = max_cod + 1
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.nome} #{self.cod}"
    
    
class Funcionario(models.Model):
    nome = models.CharField(max_length=200)
    email = models.EmailField(blank=True, null=True)
    celular = models.CharField(max_length=20, blank=True, null=True)
    fixo = models.CharField(max_length=20, blank=True, null=True)
    cod = models.PositiveIntegerField(unique=True, blank=True)
    endereco = models.CharField(max_length=255, blank=True, null=True)
    cep = models.CharField(max_length=20, blank=True, null=True)
    numero = models.CharField(max_length=20, blank=True, null=True)
    uf = models.CharField(max_length=5, blank=True, null=True)
    bairro = models.CharField(max_length=100, blank=True, null=True)
    cidade = models.CharField(max_length=100, blank=True, null=True)
    complemento = models.CharField(max_length=100, blank=True, null=True)
    rg = models.CharField(max_length=30, blank=True, null=True)
    cpf = models.CharField(max_length=20, blank=True, null=True)
    senha = models.CharField(max_length=128, blank=True, null=True)  # vai ser criptografada
    cargo = models.CharField(max_length=100, blank=True, null=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True)
    nivel_acesso = models.CharField(
        max_length=20,
        choices=NIVEL_ACESSO_CHOICES,
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.cod:
            max_cod = Funcionario.objects.aggregate(Max('cod'))['cod__max'] or 0
            self.cod = max_cod + 1
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.nome} #{self.cod}"
    
class Fornecedor(models.Model):
    nome = models.CharField(max_length=200)
    email = models.EmailField(blank=True, null=True)
    celular = models.CharField(max_length=20, blank=True, null=True)
    fixo = models.CharField(max_length=20, blank=True, null=True)
    cod = models.PositiveIntegerField(unique=True, blank=True)
    endereco = models.CharField(max_length=255, blank=True, null=True)
    cep = models.CharField(max_length=20, blank=True, null=True)
    numero = models.CharField(max_length=20, blank=True, null=True)
    uf = models.CharField(max_length=5, blank=True, null=True)
    bairro = models.CharField(max_length=100, blank=True, null=True)
    cidade = models.CharField(max_length=100, blank=True, null=True)
    complemento = models.CharField(max_length=100, blank=True, null=True)
    cnpj = models.CharField(max_length=30, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.cod:
            max_cod = Fornecedor.objects.aggregate(Max('cod'))['cod__max'] or 0
            self.cod = max_cod + 1
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.nome} #{self.cod}"


class Produto(models.Model):
    descricao = models.CharField(max_length=255)
    cod = models.PositiveIntegerField(unique=True, blank=True)
    valorUnitario = models.DecimalField(max_digits=10, decimal_places=2)
    estoque = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.cod:
            max_cod = Produto.objects.aggregate(Max('cod'))['cod__max'] or 0
            self.cod = max_cod + 1
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.descricao} (#{self.cod})"


class Venda(models.Model):
    STATUS_CHOICES = [
        ('Concluída', 'Concluída'),
        ('Pendente', 'Pendente'),
        ('Cancelada', 'Cancelada'),
    ]
    
    FORMA_PAGAMENTO_CHOICES = [
        ('Dinheiro', 'Dinheiro'),
        ('Cartão', 'Cartão'),
        ('PIX', 'PIX'),
    ]
    
    cliente = models.ForeignKey(Cliente, on_delete=models.PROTECT, related_name='vendas')
    data_venda = models.DateField()
    forma_pagamento = models.CharField(max_length=20, choices=FORMA_PAGAMENTO_CHOICES, default='Dinheiro')
    valor_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    desconto = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    valor_final = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Concluída')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Venda #{self.id} - {self.cliente.nome}"

    def calcular_totais(self):
        """Calcula valor total baseado nos itens"""
        total = sum(item.subtotal for item in self.itens.all())
        self.valor_total = total
        self.valor_final = total - self.desconto
        self.save()


class ItemVenda(models.Model):
    venda = models.ForeignKey(Venda, on_delete=models.CASCADE, related_name='itens')
    produto = models.ForeignKey(Produto, on_delete=models.PROTECT)
    quantidade = models.PositiveIntegerField()
    valor_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Calcula o subtotal
        self.subtotal = self.quantidade * self.valor_unitario
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.produto.descricao} - Qtd: {self.quantidade}"
    



@receiver(post_save, sender=Funcionario)
def criar_usuario_para_funcionario(sender, instance, created, **kwargs):
    if created and instance.user is None and instance.email:
        email = instance.email.strip().lower()  # usa o gmail do funcionário
        username = email                        # username = email
        nome = instance.nome

        # Cria o usuário do Django vinculado ao funcionário
        user = User.objects.create_user(
            username=username,
            email=email,
            password="123456",  # senha provisória
            first_name=nome
        )

        instance.user = user
        instance.save()
