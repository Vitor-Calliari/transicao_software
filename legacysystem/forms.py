from django import forms
from django.db.models import Max
from .models import Cliente, Funcionario, Fornecedor, Produto, Venda, ItemVenda

class ClienteForm(forms.ModelForm):
    cod = forms.IntegerField(widget=forms.TextInput(attrs={'readonly': 'readonly', 'style': 'background-color: #f0f0f0;'}), required=False)
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if not self.instance.pk:
            max_cod = Cliente.objects.aggregate(Max('cod'))['cod__max'] or 0
            self.instance.cod = max_cod + 1
            self.fields['cod'].initial = max_cod + 1
    
    def clean_cod(self):
        return self.instance.cod
    
    class Meta:
        model = Cliente
        fields = '__all__'

class FuncionarioForm(forms.ModelForm):
    cod = forms.IntegerField(widget=forms.TextInput(attrs={'readonly': 'readonly', 'style': 'background-color: #f0f0f0;'}), required=False)
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if not self.instance.pk:
            max_cod = Funcionario.objects.aggregate(Max('cod'))['cod__max'] or 0
            self.instance.cod = max_cod + 1
            self.fields['cod'].initial = max_cod + 1
    
    def clean_cod(self):
        return self.instance.cod
    
    class Meta:
        model = Funcionario
        fields = '__all__'
        
class FornecedorForm(forms.ModelForm):
    cod = forms.IntegerField(widget=forms.TextInput(attrs={'readonly': 'readonly', 'style': 'background-color: #f0f0f0;'}), required=False)
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if not self.instance.pk:
            max_cod = Fornecedor.objects.aggregate(Max('cod'))['cod__max'] or 0
            self.instance.cod = max_cod + 1
            self.fields['cod'].initial = max_cod + 1
    
    def clean_cod(self):
        return self.instance.cod
    
    class Meta:
        model = Fornecedor
        fields = '__all__'

class ProdutoForm(forms.ModelForm):
    cod = forms.IntegerField(widget=forms.TextInput(attrs={'readonly': 'readonly', 'style': 'background-color: #f0f0f0;'}), required=False)
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if not self.instance.pk:
            max_cod = Produto.objects.aggregate(Max('cod'))['cod__max'] or 0
            self.instance.cod = max_cod + 1
            self.fields['cod'].initial = max_cod + 1
    
    def clean_cod(self):
        return self.instance.cod
    
    class Meta:
        model = Produto
        fields = '__all__'

class VendaForm(forms.ModelForm):
    class Meta:
        model = Venda
        fields = ['cliente', 'data_venda', 'forma_pagamento', 'desconto', 'status']

class ItemVendaForm(forms.ModelForm):
    class Meta:
        model = ItemVenda
        fields = ['produto', 'quantidade', 'valor_unitario']