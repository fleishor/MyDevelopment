namespace Road.BusinessLayer.Behaviors.Query;

using FluentValidation;
using MediatR;
using Road.BusinessLayer.Interfaces.Query;

public class QueryValidationBehavior<TQuery, TQueryResult>(IEnumerable<IValidator<TQuery>> validators)
    : IPipelineBehavior<TQuery, TQueryResult>
    where TQuery : IQuery<IQueryResult>
{
    public async Task<TQueryResult> Handle(TQuery request, RequestHandlerDelegate<TQueryResult> next, CancellationToken cancellationToken)
    {
        if (validators.Any())
        {
            var context = new ValidationContext<TQuery>(request);

            var validationResults = await Task.WhenAll(
                validators.Select(v => v.ValidateAsync(context, cancellationToken)));

            var failures = validationResults
                .Where(r => r.Errors.Count > 0)
                .SelectMany(r => r.Errors)
                .ToList();

            if (failures.Count > 0)
            {
                throw new ValidationException(failures);
            }
        }

        return await next();
    }
}