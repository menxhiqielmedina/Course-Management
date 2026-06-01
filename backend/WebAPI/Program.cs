using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using WebAPI.Data;
using WebAPI.Interfaces;
using WebAPI.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
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
    });

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IAdminService, AdminService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

// app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// TEMPORARY: Seed admin if none exists — remove after logging in
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<WebAPI.Data.AppDbContext>();
    var hasher = new Microsoft.AspNetCore.Identity.PasswordHasher<WebAPI.Models.User>();
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
            CreatedAt = DateTime.UtcNow
        };
        admin.PasswordHash = hasher.HashPassword(admin, "Admin@1234");
        db.Users.Add(admin);
        db.SaveChanges();
        Console.WriteLine("[TEMP] Admin created — Email: admin@university.edu | Password: Admin@1234");
    }
    else
    {
        admin.PasswordHash = hasher.HashPassword(admin, "Admin@1234");
        db.SaveChanges();
        Console.WriteLine($"[TEMP] Admin email: {admin.Email} | Password reset to: Admin@1234");
    }
}

app.Run();
