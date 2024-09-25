namespace Road.BusinessLayer.Interfaces.Query
{
    using MediatR;

    public interface IQuery<out TQueryResult> : IRequest<TQueryResult>
        where TQueryResult : IQueryResult
    {
    }
}
