namespace WebAPI.DTOs
{
    public class StudentCreateDto
    {
        public string FullName { get; set; }
        public string Email { get; set; }
    }

    public class StudentUpdateDto
    {
        public string FullName { get; set; }
        public string Email { get; set; }
    }

    public class StudentResponseDto
    {
        public int Id { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
    }
}
