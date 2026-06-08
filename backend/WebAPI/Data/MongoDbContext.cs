using MongoDB.Driver;
using WebAPI.Models;

namespace WebAPI.Data
{
    public class MongoDbContext
    {
        private readonly IMongoDatabase _database;

        public MongoDbContext(IConfiguration config)
        {
            var connectionString = config["MongoDb:ConnectionString"]!;
            var databaseName = config["MongoDb:DatabaseName"]!;
            var client = new MongoClient(connectionString);
            _database = client.GetDatabase(databaseName);
        }

        public IMongoCollection<MongoAuditLog> AuditLogs =>
            _database.GetCollection<MongoAuditLog>("audit_logs");
    }
}
