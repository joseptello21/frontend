$body = '{"email":"demo@ejemplo.local","password":"Demo1234!","nombre":"Usuario Demo"}'
try {
  $resp = Invoke-RestMethod -Uri 'http://localhost:12437/auth/register' -Method Post -Body $body -ContentType 'application/json' -ErrorAction Stop
  Write-Output 'SUCCESS'
  $resp | ConvertTo-Json -Depth 5 | Write-Output
} catch {
  if ($_.Exception.Response) {
    $r = $_.Exception.Response
    $reader = [System.IO.StreamReader]::new($r.GetResponseStream())
    Write-Output 'ERROR'
    Write-Output ('STATUS:' + $r.StatusCode)
    Write-Output 'BODY:'
    Write-Output $reader.ReadToEnd()
  } else {
    Write-Output 'EXCEPTION'
    Write-Output $_.Exception.Message
  }
}
