from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from legacysystem.models import Funcionario


@receiver(post_save, sender=Funcionario)
def criar_usuario_para_funcionario(sender, instance, created, **kwargs):
    if created and instance.user is None:

        # cria user
        user = User.objects.create_user(
            username=instance.email,
            email=instance.email,
            password=instance.senha  # já criptografada na view
        )

        # níveis de acesso
        if instance.nivel_acesso == 'administrador':
            user.is_staff = True
            user.is_superuser = True
        else:
            user.is_staff = False
            user.is_superuser = False

        user.save()

        # associa
        instance.user = user
        instance.save()
