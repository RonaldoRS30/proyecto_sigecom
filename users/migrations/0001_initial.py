from django.db import migrations, models

class Migration(migrations.Migration):
    initial = True
    dependencies = []
    operations = [
        migrations.CreateModel(
            name='Usuario',
            fields=[
                ('id_usuario', models.AutoField(primary_key=True, serialize=False)),
                ('usuario', models.CharField(max_length=100, unique=True)),
            ],
            options={
                'db_table': 'usuarios',
                'managed': False, # IMPORTANTE: Para que no intente crearla
            },
        ),
    ]