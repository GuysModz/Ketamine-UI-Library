--// Ketamine UI Library
--// Drop-in replacement for Rayfield API matching Ketamine Hub aesthetics

local Library = {}
local TweenService = game:GetService("TweenService")
local Players = game:GetService("Players")
local UserInputService = game:GetService("UserInputService")
local CoreGui = game:GetService("CoreGui")

local COLORS = {
    bg_dark       = Color3.fromRGB(12, 10, 18),
    bg_panel      = Color3.fromRGB(18, 14, 28),
    bg_input      = Color3.fromRGB(28, 22, 42),
    purple_main   = Color3.fromRGB(140, 60, 220),
    purple_light  = Color3.fromRGB(180, 100, 255),
    purple_dark   = Color3.fromRGB(80, 30, 140),
    text_primary  = Color3.fromRGB(230, 220, 245),
    text_secondary= Color3.fromRGB(160, 140, 185),
    text_dim      = Color3.fromRGB(100, 85, 130),
    success       = Color3.fromRGB(80, 220, 120),
    error         = Color3.fromRGB(220, 60, 80),
}

local function tween(obj, props, time)
    local t = TweenService:Create(obj, TweenInfo.new(time or 0.2, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), props)
    t:Play()
    return t
end

local function makeCorner(parent, radius)
    local c = Instance.new("UICorner")
    c.CornerRadius = UDim.new(0, radius)
    c.Parent = parent
    return c
end

function Library:CreateWindow(config)
    local title = config.Name or "Ketamine Hub"
    
    -- Destroy old instance if exists
    local old = CoreGui:FindFirstChild("KetamineUI")
    if old then old:Destroy() end

    local gui = Instance.new("ScreenGui")
    gui.Name = "KetamineUI"
    gui.ResetOnSpawn = false
    gui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
    
    -- Try to parent to CoreGui, fallback to PlayerGui
    local success = pcall(function() gui.Parent = CoreGui end)
    if not success then gui.Parent = Players.LocalPlayer.PlayerGui end

    local main = Instance.new("Frame")
    main.Name = "Main"
    main.Size = UDim2.new(0, 500, 0, 350)
    main.Position = UDim2.new(0.5, -250, 0.5, -175)
    main.BackgroundColor3 = COLORS.bg_dark
    main.BorderSizePixel = 0
    main.Parent = gui
    makeCorner(main, 10)

    -- Stroke
    local stroke = Instance.new("UIStroke")
    stroke.Color = COLORS.purple_main
    stroke.Thickness = 1.5
    stroke.Transparency = 0.4
    stroke.Parent = main

    -- Dragging logic
    local dragging, dragInput, dragStart, startPos
    main.InputBegan:Connect(function(input)
        if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
            dragging = true
            dragStart = input.Position
            startPos = main.Position
            input.Changed:Connect(function()
                if input.UserInputState == Enum.UserInputState.End then dragging = false end
            end)
        end
    end)
    main.InputChanged:Connect(function(input)
        if input.UserInputType == Enum.UserInputType.MouseMovement or input.UserInputType == Enum.UserInputType.Touch then
            dragInput = input
        end
    end)
    UserInputService.InputChanged:Connect(function(input)
        if input == dragInput and dragging then
            local delta = input.Position - dragStart
            main.Position = UDim2.new(startPos.X.Scale, startPos.X.Offset + delta.X, startPos.Y.Scale, startPos.Y.Offset + delta.Y)
        end
    end)

    -- Sidebar
    local sidebar = Instance.new("Frame")
    sidebar.Name = "Sidebar"
    sidebar.Size = UDim2.new(0, 140, 1, 0)
    sidebar.BackgroundColor3 = COLORS.bg_panel
    sidebar.BorderSizePixel = 0
    sidebar.Parent = main
    makeCorner(sidebar, 10)
    
    -- Fix right corners of sidebar to blend with main
    local sbClip = Instance.new("Frame")
    sbClip.Size = UDim2.new(0, 10, 1, 0)
    sbClip.Position = UDim2.new(1, -10, 0, 0)
    sbClip.BackgroundColor3 = COLORS.bg_panel
    sbClip.BorderSizePixel = 0
    sbClip.Parent = sidebar

    local titleLbl = Instance.new("TextLabel")
    titleLbl.Size = UDim2.new(1, 0, 0, 40)
    titleLbl.BackgroundTransparency = 1
    titleLbl.Text = title
    titleLbl.TextColor3 = COLORS.purple_light
    titleLbl.Font = Enum.Font.GothamBold
    titleLbl.TextSize = 14
    titleLbl.Parent = sidebar

    local tabContainer = Instance.new("ScrollingFrame")
    tabContainer.Size = UDim2.new(1, 0, 1, -50)
    tabContainer.Position = UDim2.new(0, 0, 0, 50)
    tabContainer.BackgroundTransparency = 1
    tabContainer.ScrollBarThickness = 0
    tabContainer.Parent = sidebar
    
    local tabLayout = Instance.new("UIListLayout")
    tabLayout.Padding = UDim.new(0, 5)
    tabLayout.HorizontalAlignment = Enum.HorizontalAlignment.Center
    tabLayout.Parent = tabContainer

    -- Content Area
    local contentArea = Instance.new("Frame")
    contentArea.Size = UDim2.new(1, -150, 1, -20)
    contentArea.Position = UDim2.new(0, 145, 0, 10)
    contentArea.BackgroundTransparency = 1
    contentArea.Parent = main

    local WindowObj = {
        CurrentTab = nil,
        Tabs = {}
    }

    function WindowObj:CreateTab(name, icon)
        local tabBtn = Instance.new("TextButton")
        tabBtn.Size = UDim2.new(0.9, 0, 0, 30)
        tabBtn.BackgroundColor3 = COLORS.bg_input
        tabBtn.BackgroundTransparency = 1
        tabBtn.Text = "  " .. name
        tabBtn.TextColor3 = COLORS.text_secondary
        tabBtn.Font = Enum.Font.GothamMedium
        tabBtn.TextSize = 13
        tabBtn.TextXAlignment = Enum.TextXAlignment.Left
        tabBtn.Parent = tabContainer
        makeCorner(tabBtn, 6)

        local tabContent = Instance.new("ScrollingFrame")
        tabContent.Size = UDim2.new(1, 0, 1, 0)
        tabContent.BackgroundTransparency = 1
        tabContent.ScrollBarThickness = 2
        tabContent.ScrollBarImageColor3 = COLORS.purple_main
        tabContent.Visible = false
        tabContent.Parent = contentArea

        local contentLayout = Instance.new("UIListLayout")
        contentLayout.Padding = UDim.new(0, 8)
        contentLayout.Parent = tabContent

        -- Auto resize canvas
        contentLayout:GetPropertyChangedSignal("AbsoluteContentSize"):Connect(function()
            tabContent.CanvasSize = UDim2.new(0, 0, 0, contentLayout.AbsoluteContentSize.Y + 10)
        end)

        local TabObj = {}
        
        tabBtn.MouseButton1Click:Connect(function()
            for _, t in pairs(WindowObj.Tabs) do
                t.Button.BackgroundTransparency = 1
                t.Button.TextColor3 = COLORS.text_secondary
                t.Content.Visible = false
            end
            tabBtn.BackgroundTransparency = 0.5
            tabBtn.TextColor3 = COLORS.text_primary
            tabContent.Visible = true
            WindowObj.CurrentTab = name
        end)

        table.insert(WindowObj.Tabs, {Button = tabBtn, Content = tabContent, Name = name})

        -- Auto open first tab
        if #WindowObj.Tabs == 1 then
            tabBtn.BackgroundTransparency = 0.5
            tabBtn.TextColor3 = COLORS.text_primary
            tabContent.Visible = true
        end

        function TabObj:CreateSection(secName)
            local lbl = Instance.new("TextLabel")
            lbl.Size = UDim2.new(1, 0, 0, 25)
            lbl.BackgroundTransparency = 1
            lbl.Text = " " .. secName
            lbl.TextColor3 = COLORS.purple_light
            lbl.Font = Enum.Font.GothamBold
            lbl.TextSize = 14
            lbl.TextXAlignment = Enum.TextXAlignment.Left
            lbl.Parent = tabContent
        end

        function TabObj:CreateToggle(tConfig)
            local tName = tConfig.Name or "Toggle"
            local state = tConfig.CurrentValue or false
            local cb = tConfig.Callback or function() end

            local frame = Instance.new("Frame")
            frame.Size = UDim2.new(1, -10, 0, 36)
            frame.BackgroundColor3 = COLORS.bg_input
            frame.Parent = tabContent
            makeCorner(frame, 6)

            local lbl = Instance.new("TextLabel")
            lbl.Size = UDim2.new(1, -50, 1, 0)
            lbl.Position = UDim2.new(0, 10, 0, 0)
            lbl.BackgroundTransparency = 1
            lbl.Text = tName
            lbl.TextColor3 = COLORS.text_primary
            lbl.Font = Enum.Font.GothamMedium
            lbl.TextSize = 13
            lbl.TextXAlignment = Enum.TextXAlignment.Left
            lbl.Parent = frame

            local btn = Instance.new("TextButton")
            btn.Size = UDim2.new(1, 0, 1, 0)
            btn.BackgroundTransparency = 1
            btn.Text = ""
            btn.Parent = frame

            local indicator = Instance.new("Frame")
            indicator.Size = UDim2.new(0, 20, 0, 20)
            indicator.Position = UDim2.new(1, -30, 0.5, -10)
            indicator.BackgroundColor3 = state and COLORS.purple_main or COLORS.bg_dark
            indicator.Parent = frame
            makeCorner(indicator, 4)
            local indStroke = Instance.new("UIStroke")
            indStroke.Color = COLORS.purple_dark
            indStroke.Parent = indicator

            btn.MouseButton1Click:Connect(function()
                state = not state
                tween(indicator, {BackgroundColor3 = state and COLORS.purple_main or COLORS.bg_dark})
                cb(state)
            end)
            
            -- Init callback
            task.spawn(function() cb(state) end)
        end

        function TabObj:CreateButton(bConfig)
            local bName = bConfig.Name or "Button"
            local cb = bConfig.Callback or function() end

            local btn = Instance.new("TextButton")
            btn.Size = UDim2.new(1, -10, 0, 34)
            btn.BackgroundColor3 = COLORS.bg_input
            btn.Text = bName
            btn.TextColor3 = COLORS.text_primary
            btn.Font = Enum.Font.GothamMedium
            btn.TextSize = 13
            btn.AutoButtonColor = false
            btn.Parent = tabContent
            makeCorner(btn, 6)
            
            local stroke = Instance.new("UIStroke")
            stroke.Color = COLORS.purple_dark
            stroke.Parent = btn

            btn.MouseEnter:Connect(function() tween(btn, {BackgroundColor3 = COLORS.purple_dark}) end)
            btn.MouseLeave:Connect(function() tween(btn, {BackgroundColor3 = COLORS.bg_input}) end)
            btn.MouseButton1Down:Connect(function() tween(btn, {BackgroundColor3 = COLORS.purple_main}) end)
            btn.MouseButton1Up:Connect(function() tween(btn, {BackgroundColor3 = COLORS.bg_input}) end)
            btn.MouseButton1Click:Connect(cb)
        end

        function TabObj:CreateSlider(sConfig)
            local sName = sConfig.Name or "Slider"
            local min = sConfig.Min or 0
            local max = sConfig.Max or 100
            local default = sConfig.Default or min
            local inc = sConfig.Increment or 1
            local cb = sConfig.Callback or function() end

            local frame = Instance.new("Frame")
            frame.Size = UDim2.new(1, -10, 0, 50)
            frame.BackgroundColor3 = COLORS.bg_input
            frame.Parent = tabContent
            makeCorner(frame, 6)

            local lbl = Instance.new("TextLabel")
            lbl.Size = UDim2.new(1, -20, 0, 25)
            lbl.Position = UDim2.new(0, 10, 0, 0)
            lbl.BackgroundTransparency = 1
            lbl.Text = sName
            lbl.TextColor3 = COLORS.text_primary
            lbl.Font = Enum.Font.GothamMedium
            lbl.TextSize = 13
            lbl.TextXAlignment = Enum.TextXAlignment.Left
            lbl.Parent = frame

            local valLbl = Instance.new("TextLabel")
            valLbl.Size = UDim2.new(0, 50, 0, 25)
            valLbl.Position = UDim2.new(1, -60, 0, 0)
            valLbl.BackgroundTransparency = 1
            valLbl.Text = tostring(default)
            valLbl.TextColor3 = COLORS.purple_light
            valLbl.Font = Enum.Font.GothamMedium
            valLbl.TextSize = 13
            valLbl.TextXAlignment = Enum.TextXAlignment.Right
            valLbl.Parent = frame

            local sliderBg = Instance.new("TextButton")
            sliderBg.Size = UDim2.new(1, -20, 0, 6)
            sliderBg.Position = UDim2.new(0, 10, 0, 32)
            sliderBg.BackgroundColor3 = COLORS.bg_dark
            sliderBg.Text = ""
            sliderBg.AutoButtonColor = false
            sliderBg.Parent = frame
            makeCorner(sliderBg, 3)

            local sliderFill = Instance.new("Frame")
            sliderFill.Size = UDim2.new(math.clamp((default - min) / (max - min), 0, 1), 0, 1, 0)
            sliderFill.BackgroundColor3 = COLORS.purple_main
            sliderFill.BorderSizePixel = 0
            sliderFill.Parent = sliderBg
            makeCorner(sliderFill, 3)

            local dragging = false
            local function updateSlider(input)
                local pos = math.clamp((input.Position.X - sliderBg.AbsolutePosition.X) / sliderBg.AbsoluteSize.X, 0, 1)
                local val = math.floor((min + pos * (max - min)) / inc + 0.5) * inc
                val = math.clamp(val, min, max)
                
                local mappedPos = (val - min) / (max - min)
                tween(sliderFill, {Size = UDim2.new(mappedPos, 0, 1, 0)}, 0.1)
                valLbl.Text = tostring(val)
                cb(val)
            end

            sliderBg.InputBegan:Connect(function(input)
                if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
                    dragging = true
                    updateSlider(input)
                end
            end)
            
            UserInputService.InputEnded:Connect(function(input)
                if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
                    dragging = false
                end
            end)

            UserInputService.InputChanged:Connect(function(input)
                if dragging and (input.UserInputType == Enum.UserInputType.MouseMovement or input.UserInputType == Enum.UserInputType.Touch) then
                    updateSlider(input)
                end
            end)
            
            -- Init
            task.spawn(function() cb(default) end)
        end

        return TabObj
    end

    function WindowObj:Notify(nConfig)
        local title = nConfig.Title or "Notification"
        local content = nConfig.Content or ""
        local dur = nConfig.Duration or 3

        local notif = Instance.new("Frame")
        notif.Size = UDim2.new(0, 250, 0, 60)
        notif.Position = UDim2.new(1, 20, 1, -80)
        notif.BackgroundColor3 = COLORS.bg_panel
        notif.Parent = gui
        makeCorner(notif, 6)
        
        local stroke = Instance.new("UIStroke")
        stroke.Color = COLORS.purple_main
        stroke.Parent = notif

        local tLbl = Instance.new("TextLabel")
        tLbl.Size = UDim2.new(1, -20, 0, 25)
        tLbl.Position = UDim2.new(0, 10, 0, 5)
        tLbl.BackgroundTransparency = 1
        tLbl.Text = title
        tLbl.TextColor3 = COLORS.purple_light
        tLbl.Font = Enum.Font.GothamBold
        tLbl.TextSize = 13
        tLbl.TextXAlignment = Enum.TextXAlignment.Left
        tLbl.Parent = notif

        local cLbl = Instance.new("TextLabel")
        cLbl.Size = UDim2.new(1, -20, 0, 25)
        cLbl.Position = UDim2.new(0, 10, 0, 25)
        cLbl.BackgroundTransparency = 1
        cLbl.Text = content
        cLbl.TextColor3 = COLORS.text_secondary
        cLbl.Font = Enum.Font.GothamMedium
        cLbl.TextSize = 12
        cLbl.TextXAlignment = Enum.TextXAlignment.Left
        cLbl.TextWrapped = true
        cLbl.Parent = notif

        tween(notif, {Position = UDim2.new(1, -270, 1, -80)}, 0.4)
        task.delay(dur, function()
            tween(notif, {Position = UDim2.new(1, 20, 1, -80)}, 0.4).Completed:Connect(function()
                notif:Destroy()
            end)
        end)
    end

    return WindowObj
end

return Library
