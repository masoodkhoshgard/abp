using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Routing;
using Microsoft.Extensions.Options;
using Volo.Abp.Users;

namespace Volo.Abp.AspNetCore.Components.Web.Security;

public class AbpAuthenticationSessionState : ComponentBase
{
    private const string SessionKey = "authentication-session-id";
    
    [Inject]
    protected ILocalStorageService LocalStorage { get; set; } = default!;
    
    [Inject]
    protected ICurrentUser CurrentUser { get; set; } = default!;
    
    [Inject]
    protected NavigationManager NavigationManager { get; set; } = default!;
    
    [Inject]
    protected IOptions<AbpAuthenticationOptions> AuthenticationOptions { get; set; } = default!;

    protected async override Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            NavigationManager.RegisterLocationChangingHandler(OnLocationChangingAsync);
            if (CurrentUser.IsAuthenticated)
            {
                await SetAuthenticationStateAsync();
            }
            else
            {
                await ClearAuthenticationStateAsync();
            }
        }
    }
    
    protected virtual async ValueTask OnLocationChangingAsync(LocationChangingContext context)
    {
        if (context.TargetLocation.Contains(AuthenticationOptions.Value.LogoutUrl))
        {
            await ClearAuthenticationStateAsync();
        }
    }
    
    protected virtual async Task SetAuthenticationStateAsync()
    {
        var sessionId = await LocalStorage.GetItemAsync(SessionKey);
        if (sessionId.IsNullOrWhiteSpace())
        {
            sessionId = CurrentUser.FindSessionId() ?? Guid.NewGuid().ToString();
        }
        
        await LocalStorage.SetItemAsync(SessionKey, sessionId);
    }
    
    protected virtual async Task ClearAuthenticationStateAsync()
    {
        await LocalStorage.RemoveItemAsync(SessionKey);
    }
}