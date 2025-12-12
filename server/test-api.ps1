# Quick test script for Resume Craft API
# Make sure server is running: node server.js

Write-Host "🧪 Testing Resume Craft API" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000/api"

# Test 1: Health Check
Write-Host "1️⃣ Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health"
    Write-Host "   ✅ Server: $($health.status)" -ForegroundColor Green
    Write-Host "   📊 Database: $($health.database)" -ForegroundColor Green
    Write-Host "   👥 Users: $($health.stats.users)" -ForegroundColor Green
    Write-Host "   📄 Resumes: $($health.stats.resumes)`n" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Server not running! Start with: node server.js`n" -ForegroundColor Red
    exit
}

# Test 2: Signup (or get existing user)
Write-Host "2️⃣ User Authentication..." -ForegroundColor Yellow
$email = "testuser@example.com"
$password = "test123456"
$token = $null

try {
    # Try signup
    $signupBody = @{
        name = "Test User"
        email = $email
        password = $password
    } | ConvertTo-Json
    
    $signup = Invoke-RestMethod -Uri "$baseUrl/auth/signup" `
        -Method POST `
        -ContentType "application/json" `
        -Body $signupBody
    
    Write-Host "   ✅ New user created: $($signup.user.name)" -ForegroundColor Green
    $token = $signup.token
} catch {
    # User exists, try signin
    try {
        $signinBody = @{
            email = $email
            password = $password
        } | ConvertTo-Json
        
        $signin = Invoke-RestMethod -Uri "$baseUrl/auth/signin" `
            -Method POST `
            -ContentType "application/json" `
            -Body $signinBody
        
        Write-Host "   ✅ Signed in: $($signin.user.name)" -ForegroundColor Green
        $token = $signin.token
    } catch {
        Write-Host "   ❌ Authentication failed!`n" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        exit
    }
}

Write-Host ""

# Test 3: Create Resume
Write-Host "3️⃣ Creating Resume..." -ForegroundColor Yellow
try {
    $resumeBody = @{
        fullName = "John Doe"
        role = "SOFTWARE ENGINEER"
        email = "john@example.com"
        phone = "+1 234 567 8900"
        address = "123 Main St, City, State"
        degree = "Bachelor of Computer Science"
        school = "Tech University"
        eduYears = "2018-2022"
        skills = "JavaScript, React, Node.js, MongoDB"
        summary = "Experienced software engineer with 5 years of full-stack development."
        experience = @(
            @{
                jobTitle = "Senior Developer"
                company = "Tech Corp"
                years = "2022-Present"
                description = "Lead development of web applications"
            }
        )
        projects = @(
            @{ title = "E-commerce Platform" }
            @{ title = "Task Management App" }
        )
        templateId = "1"
    } | ConvertTo-Json -Depth 10
    
    $resume = Invoke-RestMethod -Uri "$baseUrl/resumes" `
        -Method POST `
        -ContentType "application/json" `
        -Headers @{Authorization="Bearer $token"} `
        -Body $resumeBody
    
    Write-Host "   ✅ Resume created!" -ForegroundColor Green
    Write-Host "   📄 ID: $($resume._id)" -ForegroundColor Green
    Write-Host "   👤 Name: $($resume.fullName)" -ForegroundColor Green
    Write-Host "   💼 Role: $($resume.role)`n" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed to create resume" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)`n" -ForegroundColor Red
}

# Test 4: Get All Resumes
Write-Host "4️⃣ Fetching All Resumes..." -ForegroundColor Yellow
try {
    $resumes = Invoke-RestMethod -Uri "$baseUrl/resumes" `
        -Method GET `
        -Headers @{Authorization="Bearer $token"}
    
    Write-Host "   ✅ Found $($resumes.Count) resume(s)" -ForegroundColor Green
    foreach ($r in $resumes) {
        Write-Host "   📄 $($r.fullName) - $($r.role)" -ForegroundColor Cyan
    }
    Write-Host ""
} catch {
    Write-Host "   ❌ Failed to fetch resumes`n" -ForegroundColor Red
}

# Test 5: Check Database
Write-Host "5️⃣ Database Status..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health"
    Write-Host "   ✅ Total Users: $($health.stats.users)" -ForegroundColor Green
    Write-Host "   ✅ Total Resumes: $($health.stats.resumes)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Could not get database stats" -ForegroundColor Red
}

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "✅ All tests completed!" -ForegroundColor Green
Write-Host "================================`n" -ForegroundColor Cyan

Write-Host "💡 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Check MongoDB Atlas to see your data" -ForegroundColor White
Write-Host "   2. Open your web app and test signup/login" -ForegroundColor White
Write-Host "   3. Create a resume through the UI" -ForegroundColor White
Write-Host ""