using System.ComponentModel.DataAnnotations;

namespace WebAPI.DTOs
{
    public class LoginResult
    {
        public AuthResponseDto? Data { get; set; }
        public string? ErrorMessage { get; set; }
        public bool IsPending { get; set; }
        public bool IsRejected { get; set; }
    }


    public class RegisterRequestDto
    {
        [Required]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;

        public string Role { get; set; } = "student";

        [MaxLength(100)]
        public string Department { get; set; } = string.Empty;
    }

    public class LoginRequestDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }

    public class AuthResponseDto
    {
        public int Id { get; set; }

        public string FullName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string Role { get; set; } = string.Empty;

        public string AccessToken { get; set; } = string.Empty;

        public bool MustChangePassword { get; set; }

        // Populated by the service but excluded from the JSON response body.
        // The controller reads this to set an HttpOnly cookie, then nulls it.
        [System.Text.Json.Serialization.JsonIgnore]
        public string? RefreshToken { get; set; }
    }

    public class ChangePasswordDto
    {
        [Required]
        public string CurrentPassword { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string NewPassword { get; set; } = string.Empty;
    }
}