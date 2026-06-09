using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using WebAPI.Data;
using WebAPI.Hubs;
using WebAPI.Interfaces;
using WebAPI.Interfaces.Repositories;
using WebAPI.Repositories;
using WebAPI.Services;

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true, reloadOnChange: true);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy
            .SetIsOriginAllowed(_ => true)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secret = jwtSettings["Secret"]!;

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret))
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                var token = ctx.Request.Query["access_token"];
                if (!string.IsNullOrEmpty(token) &&
                    ctx.HttpContext.Request.Path.StartsWithSegments("/hubs"))
                {
                    ctx.Token = token;
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddSingleton<WebAPI.Data.MongoDbContext>();

// Repositories
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IStudentRepository, StudentRepository>();
builder.Services.AddScoped<IProfessorRepository, ProfessorRepository>();
builder.Services.AddScoped<ICourseRepository, CourseRepository>();
builder.Services.AddScoped<IGradeRepository, GradeRepository>();
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<IScheduleRepository, ScheduleRepository>();
builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();

// Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IAdminService, AdminService>();
builder.Services.AddScoped<ICourseService, CourseService>();
builder.Services.AddScoped<IAssignmentService, AssignmentService>();
builder.Services.AddScoped<IFileService, FileService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IAuditLogService, AuditLogService>();
builder.Services.AddScoped<IScheduleService, ScheduleService>();
builder.Services.AddScoped<IProfileService, ProfileService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<IGradeService, GradeService>();
builder.Services.AddScoped<ICmsService, CmsService>();

builder.Services.AddSignalR();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.ResolveConflictingActions(apiDescriptions => apiDescriptions.First());
    c.MapType<IFormFile>(() => new Microsoft.OpenApi.Models.OpenApiSchema
    {
        Type = "string",
        Format = "binary"
    });
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notifications");

// ── Database seeding ───────────────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var hasher = new Microsoft.AspNetCore.Identity.PasswordHasher<WebAPI.Models.User>();

    // Departments
    if (!db.Departments.Any())
    {
        db.Departments.AddRange(
            new WebAPI.Models.Department { Name = "Computer Science", Code = "CS",   IsActive = true, CreatedAt = DateTime.UtcNow },
            new WebAPI.Models.Department { Name = "Mathematics",      Code = "MATH", IsActive = true, CreatedAt = DateTime.UtcNow },
            new WebAPI.Models.Department { Name = "Physics",          Code = "PHYS", IsActive = true, CreatedAt = DateTime.UtcNow },
            new WebAPI.Models.Department { Name = "Engineering",      Code = "ENG",  IsActive = true, CreatedAt = DateTime.UtcNow }
        );
        db.SaveChanges();
    }

    // Roles
    if (!db.Roles.Any())
    {
        db.Roles.AddRange(
            new WebAPI.Models.Role { Name = "admin",     Description = "Full system access",             CreatedAt = DateTime.UtcNow },
            new WebAPI.Models.Role { Name = "professor", Description = "Manages courses and assignments", CreatedAt = DateTime.UtcNow },
            new WebAPI.Models.Role { Name = "student",   Description = "Enrolled in courses",            CreatedAt = DateTime.UtcNow }
        );
        db.SaveChanges();
    }

    // Permissions
    if (!db.Permissions.Any())
    {
        db.Permissions.AddRange(
            new WebAPI.Models.Permission { Name = "manage_users",       Description = "Create, update, delete users" },
            new WebAPI.Models.Permission { Name = "manage_courses",     Description = "Create, update, delete courses" },
            new WebAPI.Models.Permission { Name = "manage_assignments", Description = "Create, grade assignments" },
            new WebAPI.Models.Permission { Name = "view_reports",       Description = "Access system reports" },
            new WebAPI.Models.Permission { Name = "manage_cms",         Description = "Edit CMS pages" },
            new WebAPI.Models.Permission { Name = "view_audit_logs",    Description = "View audit trail" },
            new WebAPI.Models.Permission { Name = "submit_assignments", Description = "Submit assignment work" },
            new WebAPI.Models.Permission { Name = "view_grades",        Description = "View own grades" },
            new WebAPI.Models.Permission { Name = "view_schedule",      Description = "View course schedule" }
        );
        db.SaveChanges();
    }

    // RolePermissions
    if (!db.RolePermissions.Any())
    {
        var roles = db.Roles.ToList();
        var perms = db.Permissions.ToList();

        var adminRole     = roles.First(r => r.Name == "admin");
        var professorRole = roles.First(r => r.Name == "professor");
        var studentRole   = roles.First(r => r.Name == "student");

        // Admin gets all permissions
        foreach (var perm in perms)
            db.RolePermissions.Add(new WebAPI.Models.RolePermission { RoleId = adminRole.Id, PermissionId = perm.Id });

        // Professor permissions
        var professorPerms = new[] { "manage_courses", "manage_assignments", "view_reports", "view_schedule" };
        foreach (var permName in professorPerms)
        {
            var perm = perms.FirstOrDefault(p => p.Name == permName);
            if (perm != null)
                db.RolePermissions.Add(new WebAPI.Models.RolePermission { RoleId = professorRole.Id, PermissionId = perm.Id });
        }

        // Student permissions
        var studentPerms = new[] { "submit_assignments", "view_grades", "view_schedule" };
        foreach (var permName in studentPerms)
        {
            var perm = perms.FirstOrDefault(p => p.Name == permName);
            if (perm != null)
                db.RolePermissions.Add(new WebAPI.Models.RolePermission { RoleId = studentRole.Id, PermissionId = perm.Id });
        }

        db.SaveChanges();
    }

    // SystemSettings
    if (!db.SystemSettings.Any())
    {
        db.SystemSettings.AddRange(
            new WebAPI.Models.SystemSetting { Key = "app_name",             Value = "Course Management System",   Description = "Application display name",       UpdatedAt = DateTime.UtcNow },
            new WebAPI.Models.SystemSetting { Key = "max_courses_per_student", Value = "8",                       Description = "Max courses a student can enroll",UpdatedAt = DateTime.UtcNow },
            new WebAPI.Models.SystemSetting { Key = "academic_year",         Value = "2025-2026",                  Description = "Current academic year",          UpdatedAt = DateTime.UtcNow },
            new WebAPI.Models.SystemSetting { Key = "current_semester",      Value = "Spring",                     Description = "Current semester",               UpdatedAt = DateTime.UtcNow },
            new WebAPI.Models.SystemSetting { Key = "allow_self_enrollment", Value = "true",                       Description = "Students can self-enroll",       UpdatedAt = DateTime.UtcNow },
            new WebAPI.Models.SystemSetting { Key = "assignment_late_policy",Value = "penalty_10pct",              Description = "Late submission penalty policy", UpdatedAt = DateTime.UtcNow }
        );
        db.SaveChanges();
    }

    // Admin user
    var admin = db.Users.FirstOrDefault(u => u.Role == "admin");
    if (admin == null)
    {
        admin = new WebAPI.Models.User
        {
            FullName = "Admin",
            Email = "admin@university.edu",
            Role = "admin",
            Status = "approved",
            MustChangePassword = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        admin.PasswordHash = hasher.HashPassword(admin, "Admin@1234");
        db.Users.Add(admin);
        db.SaveChanges();
        Console.WriteLine("[Seed] Admin created — Email: admin@university.edu | Password: Admin@1234");
    }
    else
    {
        admin.PasswordHash = hasher.HashPassword(admin, "Admin@1234");
        admin.UpdatedAt = DateTime.UtcNow;
        db.SaveChanges();
        Console.WriteLine($"[Seed] Admin: {admin.Email} | Password reset to: Admin@1234");
    }

    // UserRoles for existing users that don't have a UserRole entry yet
    var allUsers = db.Users.ToList();
    var existingUserRoleIds = db.UserRoles.Select(ur => ur.UserId).ToHashSet();
    var rolesList = db.Roles.ToList();

    foreach (var user in allUsers)
    {
        if (existingUserRoleIds.Contains(user.Id)) continue;
        var matchedRole = rolesList.FirstOrDefault(r => r.Name == user.Role);
        if (matchedRole != null)
            db.UserRoles.Add(new WebAPI.Models.UserRole { UserId = user.Id, RoleId = matchedRole.Id, AssignedAt = DateTime.UtcNow });
    }
    db.SaveChanges();
}

app.Run();