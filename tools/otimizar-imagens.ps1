<#
  VHARAK | tools/otimizar-imagens.ps1
  Reduz o peso das capas e das fotos de produto.

  As imagens da vitrine aparecem com 300 px de largura (cartao) e 300 px
  (detalhe). Guardar 15 MB para isso e desperdicio: cada pagina de produto
  baixaria megabytes.

  Regra: lado maior no maximo 640 px, JPEG com qualidade 82. O original
  fica preservado em frontend-antigo\assets\.

  Uso: powershell -File tools\otimizar-imagens.ps1
#>

param(
  [string]$Origem = "C:\VHARAK\frontend\assets",
  [int]$LadoMaximo = 640,
  [int]$Qualidade = 82
)

Add-Type -AssemblyName System.Drawing

$codificador = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
  Where-Object { $_.MimeType -eq 'image/jpeg' }

$parametros = New-Object System.Drawing.Imaging.EncoderParameters(1)
$parametros.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
  [System.Drawing.Imaging.Encoder]::Quality, [long]$Qualidade
)

$antes = 0
$depois = 0
$processados = 0
$ignorados = 0

Get-ChildItem -Path $Origem -Recurse -File -Include *.jpg, *.jpeg, *.png | ForEach-Object {
  $arquivo = $_.FullName
  $antes += $_.Length

  # A saida tem extensao .jpg: atualiza quem aponta para o arquivo.
  $saida = [System.IO.Path]::ChangeExtension($arquivo, ".jpg")
  $extensao = [System.IO.Path]::GetExtension($arquivo).ToLower()

  if ($extensao -eq ".jpg" -and $saida -eq $arquivo) {
    # Ja e jpg: grava por cima.
    $destino = $arquivo
  } else {
    $destino = $saida
  }

  try {
    $imagem = [System.Drawing.Image]::FromFile($arquivo)

    $largura = $imagem.Width
    $altura = $imagem.Height
    $maior = [Math]::Max($largura, $altura)

    if ($maior -le $LadoMaximo -and $extensao -eq ".jpg") {
      # Ja e jpg e pequeno: deixa como esta.
      $imagem.Dispose()
      $ignorados++
      $depois += $_.Length
      return
    }

    $escala = $LadoMaximo / $maior
    if ($escala -gt 1) { $escala = 1 }
    $novaLargura = [int][Math]::Round($largura * $escala)
    $novaAltura = [int][Math]::Round($altura * $escala)

    $nova = New-Object System.Drawing.Bitmap($novaLargura, $novaAltura)
    $grafico = [System.Drawing.Graphics]::FromImage($nova)
    $grafico.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $grafico.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $grafico.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $grafico.DrawImage($imagem, 0, 0, $novaLargura, $novaAltura)
    $grafico.Dispose()
    $imagem.Dispose()

    $nova.Save($destino, $codificador, $parametros)
    $nova.Dispose()

    $depois += (Get-Item $destino).Length
    $processados++

    if ($extensao -eq ".png") {
      # O .png antigo vira .jpg: o catalogo precisa apontar para o novo nome.
      Remove-Item $arquivo -Force
      Write-Host ("  renomeado: " + $arquivo.Replace("C:\VHARAK\frontend\assets\", "") + " -> " + (Split-Path $destino -Leaf))
    }
  } catch {
    Write-Host ("  ! falha em " + $arquivo + ": " + $_.Exception.Message)
    $depois += $_.Length
  }
}

Write-Host ""
Write-Host ("  processados: " + $processados + " | sem mudanca: " + $ignorados)
Write-Host ("  antes:  {0:N1} MB" -f ($antes / 1MB))
Write-Host ("  depois: {0:N1} MB" -f ($depois / 1MB))
if ($antes -gt 0) {
  Write-Host ("  reducao: {0:N0}%" -f ((1 - ($depois / $antes)) * 100))
}
