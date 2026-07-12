$srcDir = "c:\Users\MAN PATEL\OneDrive\Desktop\Hackathon\Odoo_AssetFlow\Odoo_AssetFlow\frontend\src"

$files = Get-ChildItem -LiteralPath $srcDir -Recurse -Include *.ts,*.tsx | Where-Object { $_.FullName -notmatch "\\lib\\api\.ts" -and $_.FullName -notmatch "\\contexts\\AuthContext\.tsx" }

foreach ($file in $files) {
    # Using Out-String to read raw content
    $content = (Get-Content -LiteralPath $file.FullName) -join "`r`n"
    
    # If the file contains a call to fetch(
    if ($content -match "fetch\(") {
        $newContent = $content -replace "\bawait fetch\(", "await fetchWithAuth("
        $newContent = $newContent -replace "\b fetch\(", " fetchWithAuth("
        
        # If we made a replacement, add the import statement at the top (if not already there)
        if ($newContent -match "fetchWithAuth" -and $newContent -notmatch "import { fetchWithAuth }") {
            $importStmt = "import { fetchWithAuth } from `"@/lib/api`";`n"
            
            $lines = $newContent -split "`r`n"
            $linesToKeep = @()
            $inserted = $false
            
            for ($i = 0; $i -lt $lines.Length; $i++) {
                $linesToKeep += $lines[$i]
                if (!$inserted -and $lines[$i] -match '^"use client"|^import ') {
                    if (($i + 1 -eq $lines.Length) -or ($lines[$i+1] -notmatch '^import ')) {
                        $linesToKeep += $importStmt.TrimEnd()
                        $inserted = $true
                    }
                }
            }
            
            if (!$inserted) {
                $newContent = $importStmt + $newContent
            } else {
                $newContent = $linesToKeep -join "`r`n"
            }
        }
        
        Set-Content -LiteralPath $file.FullName -Value $newContent
        Write-Host "Successfully updated $($file.Name)"
    }
}
