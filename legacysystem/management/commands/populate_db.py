from django.core.management.base import BaseCommand
from faker import Faker
from legacysystem.models import Cliente, Funcionario, Fornecedor, Produto, Venda, ItemVenda
import random
from datetime import datetime, date
from django.utils import timezone
from decimal import Decimal

class Command(BaseCommand):
    help = 'DB dados fakes testes'

    def handle(self, *args, **options):
        fake = Faker('pt_BR')

        # cria alguns produtos
        for _ in range(50):
            produto = Produto(
                descricao=fake.sentence(nb_words=3),
                valorUnitario=round(random.uniform(10, 1000), 2),
                estoque=random.randint(0, 100)
            )
            produto.save()
            month = random.randint(1, 11)
            day = random.randint(1, 28)
            created_date = timezone.make_aware(datetime(2025, month, day, random.randint(0, 23), random.randint(0, 59)))
            produto.created_at = created_date
            produto.save(update_fields=['created_at'])

        # para cada mês de 1 a 11 (para testes da dashboard em comparação aos messes anteriores)
        for month in range(1, 12):
            num_clientes = random.randint(10, 20)
            num_funcionarios = random.randint(10, 20)
            num_fornecedores = random.randint(10, 20)
            num_vendas = random.randint(10, 20)

            # cria clientes
            for _ in range(num_clientes):
                cliente = Cliente(
                    nome=fake.name(),
                    email=fake.email(),
                    celular=fake.phone_number(),
                    fixo=fake.phone_number() if random.choice([True, False]) else None,
                    endereco=fake.address().replace('\n', ', '),
                    cep=fake.postcode(),
                    numero=str(random.randint(1, 9999)),
                    uf=fake.state_abbr(),
                    bairro=fake.neighborhood(),
                    cidade=fake.city(),
                    complemento=fake.word() if random.choice([True, False]) else None,
                    rg=fake.rg(),
                    cpf=fake.cpf()
                )
                cliente.save()
                day = random.randint(1, 28)
                created_date = timezone.make_aware(datetime(2025, month, day, random.randint(0, 23), random.randint(0, 59)))
                cliente.created_at = created_date
                cliente.save(update_fields=['created_at'])

            # cria funcionarios
            for _ in range(num_funcionarios):
                func = Funcionario(
                    nome=fake.name(),
                    email=fake.email(),
                    celular=fake.phone_number(),
                    fixo=fake.phone_number() if random.choice([True, False]) else None,
                    endereco=fake.address().replace('\n', ', '),
                    cep=fake.postcode(),
                    numero=str(random.randint(1, 9999)),
                    uf=fake.state_abbr(),
                    bairro=fake.neighborhood(),
                    cidade=fake.city(),
                    complemento=fake.word() if random.choice([True, False]) else None,
                    rg=fake.rg(),
                    cpf=fake.cpf()
                )
                func.save()
                day = random.randint(1, 28)
                created_date = timezone.make_aware(datetime(2025, month, day, random.randint(0, 23), random.randint(0, 59)))
                func.created_at = created_date
                func.save(update_fields=['created_at'])

            # cria fornecedores
            for _ in range(num_fornecedores):
                forn = Fornecedor(
                    nome=fake.company(),
                    email=fake.email(),
                    celular=fake.phone_number(),
                    fixo=fake.phone_number() if random.choice([True, False]) else None,
                    endereco=fake.address().replace('\n', ', '),
                    cep=fake.postcode(),
                    numero=str(random.randint(1, 9999)),
                    uf=fake.state_abbr(),
                    bairro=fake.neighborhood(),
                    cidade=fake.city(),
                    complemento=fake.word() if random.choice([True, False]) else None,
                    cnpj=fake.cnpj()
                )
                forn.save()
                day = random.randint(1, 28)
                created_date = timezone.make_aware(datetime(2025, month, day, random.randint(0, 23), random.randint(0, 59)))
                forn.created_at = created_date
                forn.save(update_fields=['created_at'])

            # cria vendas
            clientes = list(Cliente.objects.all())
            produtos = list(Produto.objects.all())
            for _ in range(num_vendas):
                if not clientes or not produtos:
                    continue
                cliente = random.choice(clientes)
                venda = Venda(
                    cliente=cliente,
                    data_venda=date(2025, month, random.randint(1, 28)),
                    forma_pagamento=random.choice(['Dinheiro', 'Cartão', 'PIX']),
                    desconto=Decimal(str(round(random.uniform(0, 50), 2))),
                    status=random.choice(['Concluída', 'Pendente', 'Cancelada'])
                )
                # salva vendas
                venda.save()
                # cria itens
                num_items = random.randint(1, 5)
                total = 0
                for _ in range(num_items):
                    produto = random.choice(produtos)
                    quantidade = random.randint(1, 10)
                    valor_unitario = produto.valorUnitario
                    subtotal = quantidade * valor_unitario
                    total += subtotal
                    ItemVenda.objects.create(
                        venda=venda,
                        produto=produto,
                        quantidade=quantidade,
                        valor_unitario=valor_unitario,
                        subtotal=subtotal
                    )
                venda.valor_total = total
                venda.valor_final = total - venda.desconto
                venda.save()
                day = random.randint(1, 28)
                created_date = timezone.make_aware(datetime(2025, month, day, random.randint(0, 23), random.randint(0, 59)))
                venda.created_at = created_date
                venda.save(update_fields=['created_at'])

        self.stdout.write(self.style.SUCCESS('DB dados fakes testes - sucesso'))