namespace Road.BusinessLayer.Behaviors.Query;

using MediatR;
using Microsoft.Extensions.Logging;
using Road.BusinessLayer.Interfaces.Query;

public class QueryLoggingBehavior<TQuery, TQueryResult>(ILogger<QueryLoggingBehavior<TQuery, TQueryResult>> logger)
    : IPipelineBehavior<TQuery, TQueryResult>
    where TQuery : IQuery<IQueryResult>
{
    public async Task<TQueryResult> Handle(TQuery request, RequestHandlerDelegate<TQueryResult> next, CancellationToken cancellationToken)
    {
        logger.LogInformation("Handling query {QueryName}", typeof(TQuery).Name);
        var response = await next();
        logger.LogInformation("Handled query {QueryName}", typeof(TQuery).Name);

        return response;
    }
}
