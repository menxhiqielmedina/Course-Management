using Microsoft.EntityFrameworkCore;
using WebAPI.Data;
using WebAPI.DTOs;
using WebAPI.Interfaces;
using WebAPI.Models;

namespace WebAPI.Services
{
    public class CmsService : ICmsService
    {
        private readonly AppDbContext _context;

        public CmsService(AppDbContext context) => _context = context;

        public async Task<List<CmsPageDto>> GetAllAsync() =>
            await _context.CmsPages
                .Include(p => p.CreatedBy)
                .OrderBy(p => p.Title)
                .Select(p => Map(p))
                .ToListAsync();

        public async Task<CmsPageDto?> GetByIdAsync(int id)
        {
            var page = await _context.CmsPages
                .Include(p => p.CreatedBy)
                .FirstOrDefaultAsync(p => p.Id == id);
            return page == null ? null : Map(page);
        }

        public async Task<(CmsPageDto? page, string? error)> CreateAsync(CreateCmsPageDto dto, int userId)
        {
            var slug = NormalizeSlug(dto.Slug);
            if (await _context.CmsPages.AnyAsync(p => p.Slug == slug))
                return (null, $"A page with slug '{slug}' already exists.");

            var page = new CmsPage
            {
                Slug = slug,
                Title = dto.Title.Trim(),
                Content = dto.Content,
                Status = AllowedStatus(dto.Status),
                CreatedByUserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.CmsPages.Add(page);
            await _context.SaveChangesAsync();
            return (await GetByIdAsync(page.Id), null);
        }

        public async Task<(CmsPageDto? page, string? error)> UpdateAsync(int id, UpdateCmsPageDto dto)
        {
            var page = await _context.CmsPages.FindAsync(id);
            if (page == null) return (null, "Page not found.");

            var slug = NormalizeSlug(dto.Slug);
            if (await _context.CmsPages.AnyAsync(p => p.Slug == slug && p.Id != id))
                return (null, $"A page with slug '{slug}' already exists.");

            page.Slug = slug;
            page.Title = dto.Title.Trim();
            page.Content = dto.Content;
            page.Status = AllowedStatus(dto.Status);
            page.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return (await GetByIdAsync(id), null);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var page = await _context.CmsPages.FindAsync(id);
            if (page == null) return false;
            _context.CmsPages.Remove(page);
            await _context.SaveChangesAsync();
            return true;
        }

        private static string NormalizeSlug(string slug)
        {
            slug = slug.Trim().ToLower();
            if (!slug.StartsWith("/")) slug = "/" + slug;
            return slug;
        }

        private static string AllowedStatus(string status) =>
            status == "published" ? "published" : "draft";

        private static CmsPageDto Map(CmsPage p) => new()
        {
            Id = p.Id,
            Slug = p.Slug,
            Title = p.Title,
            Content = p.Content,
            Status = p.Status,
            CreatedByName = p.CreatedBy?.FullName,
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt
        };
    }
}