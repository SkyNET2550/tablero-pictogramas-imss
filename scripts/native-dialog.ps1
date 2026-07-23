param(
  [Parameter(Mandatory=$true)][ValidateSet("save","open")][string]$Mode,
  [Parameter(Mandatory=$true)][string]$InitialDirectory,
  [string]$SuggestedName = "tablero.json",
  [string]$Filter = "Todos los archivos (*.*)|*.*"
)

Add-Type -AssemblyName System.Windows.Forms

if ($Mode -eq "save") {
  $dialog = New-Object System.Windows.Forms.SaveFileDialog
  $dialog.InitialDirectory = $InitialDirectory
  $dialog.FileName = $SuggestedName
  $dialog.Filter = $Filter
  $dialog.RestoreDirectory = $true
  if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    Write-Output $dialog.FileName
  }
} else {
  $dialog = New-Object System.Windows.Forms.OpenFileDialog
  $dialog.InitialDirectory = $InitialDirectory
  $dialog.Filter = $Filter
  $dialog.RestoreDirectory = $true
  $dialog.Multiselect = $false
  if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    Write-Output $dialog.FileName
  }
}
