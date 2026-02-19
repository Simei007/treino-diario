# TreinoDiario (PWA)

Aplicativo web responsivo para PC e celular com registro de:
- treinos diarios
- alimentacao
- consumo de agua
- historico e estatisticas basicas

## Rodar localmente

Use um servidor estatico na pasta `C:\APKS` (PWA nao funciona bem abrindo direto com `file://`).

Exemplo com Node:

```powershell
npx serve C:\APKS
```

Depois abra a URL mostrada no navegador.

## Usar no PC e no Celular por QR Code

1. Publique os arquivos em hospedagem web (ex.: GitHub Pages, Vercel, Netlify).
2. Abra o link publicado no PC.
3. No app, escaneie o QR Code com o celular para abrir a mesma URL.
4. Instale o app no navegador (botao "Instalar App" ou menu do navegador).

## Dados

Os dados ficam salvos no `localStorage` do dispositivo.
Cada aparelho mantem seu proprio historico.

