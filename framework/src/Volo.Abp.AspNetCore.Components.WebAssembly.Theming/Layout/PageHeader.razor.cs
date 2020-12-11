﻿using Microsoft.AspNetCore.Components;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Volo.Abp.AspNetCore.Components.WebAssembly.Theming.PageToolbars;

namespace Volo.Abp.AspNetCore.Components.WebAssembly.Theming.Layout
{
    public partial class PageHeader : ComponentBase
    {
        protected List<RenderFragment> ToolbarItemRenders { get; set; }
        
        public IPageToolbarManager PageToolbarManager { get; set; }
        
        [Parameter]
        public string Title { get; set; }

        [Parameter]
        public bool BreadcrumbShowHome { get; set; } = true;

        [Parameter]
        public bool BreadcrumbShowCurrent { get; set; } = true;

        [Parameter]
        public RenderFragment ChildContent { get; set; }

        [Parameter]
        public List<BlazoriseUI.BreadcrumbItem> BreadcrumbItems { get; set; }

        [Parameter]
        public string PageName { get; set; }


        public PageHeader(IPageToolbarManager pageToolbarManager)
        {
            BreadcrumbItems = new List<BlazoriseUI.BreadcrumbItem>();
            ToolbarItemRenders = new List<RenderFragment>();
            PageToolbarManager = pageToolbarManager;
        }

        protected override async Task OnInitializedAsync()
        {
            if (!PageName.IsNullOrEmpty())
            {
                var toolbarItems = await PageToolbarManager.GetItemsAsync(PageName);

                ToolbarItemRenders.Clear();

                foreach (var item in toolbarItems)
                {
                    var sequence = 0;
                    ToolbarItemRenders.Add(builder =>
                    {
                        builder.OpenComponent(sequence, item.ComponentType);
                        if (item.Arguments != null)
                        {
                            foreach (var argument in item.Arguments)
                            {
                                sequence++;
                                builder.AddAttribute(sequence, argument.Key, argument.Value);
                            }
                        }
                        builder.CloseComponent();
                    });
                }
            }
        }
    }
}
