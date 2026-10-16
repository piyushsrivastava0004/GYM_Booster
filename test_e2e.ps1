$loginBody = @{ username = "owner"; password = "Owner@123" } | ConvertTo-Json
$auth = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $auth.token
Write-Output "1. Authenticated as $($auth.fullName) ($($auth.role))."

$headers = @{ Authorization = "Bearer $token" }

# 1. Dashboard Metrics
$metrics = Invoke-RestMethod -Uri "http://localhost:8080/api/dashboard/metrics" -Headers $headers
Write-Output "2. Dashboard: Total Members=$($metrics.totalMembersCount), Active Members=$($metrics.activeMembersCount), Month Collections=Rs.$($metrics.monthCollections)"

# 2. Register New Member
$memberEmail = "ananya.sharma" + (Get-Random -Minimum 1000 -Maximum 9999) + "@gmail.com"
$memberUsername = "ananya" + (Get-Random -Minimum 1000 -Maximum 9999)
$newMember = @{
    fullName = "Ananya Sharma"
    phone = "98" + (Get-Random -Minimum 10000000 -Maximum 99999999)
    email = $memberEmail
    username = $memberUsername
    password = "Password@123"
    branchId = 1
    gender = "FEMALE"
    dateOfBirth = "1996-04-22"
    bloodGroup = "O+"
    fitnessGoals = "Core Strengthening & Calisthenics"
    medicalHistory = "None"
} | ConvertTo-Json

$regRes = Invoke-RestMethod -Uri "http://localhost:8080/api/members/register" -Method Post -Headers $headers -Body $newMember -ContentType "application/json"
Write-Output "3. Created Member: $($regRes.fullName) (Code: $($regRes.memberCode), ProfileId: $($regRes.id), UserId: $($regRes.userId)) with QR: $($regRes.qrCodeData)"

# 3. Purchase Subscription using ProfileId
$subBody = @{
    memberId = $regRes.id
    planId = 1
    startDate = (Get-Date).ToString("yyyy-MM-dd")
    paymentMethod = "UPI"
    discountAmount = 0
    paidAmount = 2750
    notes = "Full upfront payment for monthly plan"
} | ConvertTo-Json

$subRes = Invoke-RestMethod -Uri "http://localhost:8080/api/subscriptions/purchase" -Method Post -Headers $headers -Body $subBody -ContentType "application/json"
Write-Output "4. Purchased Plan: $($subRes.planName), Status: $($subRes.status), Total: Rs.$($subRes.totalAmount), Paid: Rs.$($subRes.paidAmount), Due: Rs.$($subRes.outstandingAmount)"

# 4. Turnstile Check-In via QR Code Data
$checkInBody = @{
    qrCodeData = $regRes.qrCodeData
    branchId = 1
    verificationMethod = "QR"
} | ConvertTo-Json
$checkInRes = Invoke-RestMethod -Uri "http://localhost:8080/api/attendance/check-in" -Method Post -Headers $headers -Body $checkInBody -ContentType "application/json"
Write-Output "5. Gate Access Granted: $($checkInRes.memberName) at $($checkInRes.checkInTime), Status: $($checkInRes.status)"

# 5. Check-Out
$checkOutRes = Invoke-RestMethod -Uri "http://localhost:8080/api/attendance/check-out/$($regRes.id)" -Method Post -Headers $headers
Write-Output "6. Checked Out: Member ID $($regRes.id) at $($checkOutRes.checkOutTime), Status: $($checkOutRes.status)"

# 6. Book Group Class
$classes = Invoke-RestMethod -Uri "http://localhost:8080/api/classes" -Headers $headers
$firstClass = $classes[0]
$bookRes = Invoke-RestMethod -Uri "http://localhost:8080/api/classes/$($firstClass.id)/book?memberId=$($regRes.id)" -Method Post -Headers $headers
Write-Output "7. Group Class Reservation: $($firstClass.name) for $($regRes.fullName) -> Status: $($bookRes.status)"

# 7. Record Operational Expense
$expenseBody = @{
    title = "High-Speed Commercial Fiber Internet"
    category = "UTILITIES"
    amount = 2800
    paidTo = "Airtel Broadband Ltd"
    expenseDate = (Get-Date).ToString("yyyy-MM-dd")
    description = "Monthly gym Wi-Fi for member music streaming & biometric gates"
    paymentMethod = "BANK_TRANSFER"
    branchId = 1
} | ConvertTo-Json
$expRes = Invoke-RestMethod -Uri "http://localhost:8080/api/expenses" -Method Post -Headers $headers -Body $expenseBody -ContentType "application/json"
Write-Output "8. Expense Ledger: $($expRes.title), Rs.$($expRes.amount)"

# 8. Check PDF Tax Invoice Generation
$invoices = Invoke-RestMethod -Uri "http://localhost:8080/api/invoices/member/$($regRes.id)" -Headers $headers
Write-Output "9. Generated Invoices for Member: Found $($invoices.Count) invoice(s). Invoice #: $($invoices[0].invoiceNumber), Amount: Rs.$($invoices[0].grandTotal)"
$pdfBytes = Invoke-WebRequest -Uri "http://localhost:8080/api/invoices/$($invoices[0].id)/pdf" -Headers $headers
Write-Output "10. Tax Invoice PDF Generated: $($pdfBytes.Content.Length) bytes (Content-Type: $($pdfBytes.Headers['Content-Type']))"
