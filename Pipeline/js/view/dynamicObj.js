/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：漫游js文件
 * 遗留bug ：无
 * 修改日期：2017年11月9日
 **************************************************/
$(function () {
    var earth = top.LayerManagement.earth;
    var trackManager = STAMP.TrackManager(earth);
    $("#divThree :radio").removeAttr("checked");
    // 初始化动态对象列表
    trackManager.getDynamicObject(function (dynamic) {
        $("#selDynamicObj").append('<option value="' + dynamic.Guid + '">' + dynamic.Name + '</option>');
    }, function (fly) {
        $("#selFlyObj").append('<option value="' + fly.Guid + '">' + fly.Name + '</option>');
    });
    // region 动态物体
    $("#btnEnterOuter,#btnEnterInner").click(function () {
        top.Tools.disabledAll();
        top.disableAll(true);
        $("#selDynamicObj").attr("disabled", "disabled");
        var _tag = $(this).attr("tag");
        trackManager.enterTrack($("#selDynamicObj").val(), function (reValue) {
            if (!reValue) {
                $("#selDynamicObj").removeAttr("disabled");
                top.Tools.cancelDisabled(top.disabledButtonArr);
                top.disableAll(false);
                return;
            }
            $("#freez0").attr("disabled", "disabled");
            $("#freez1").attr("disabled", "disabled");
            $("#freez0").val(180);
            $("#freez1").val(15);
            $("#freez0Div").attr("disabled", "disabled");
            $("#freez1Div").attr("disabled", "disabled");
            $("#checkBntn div", window.top.document).attr("disabled", true);
            $("#divRoleDynObj :radio").removeAttr("checked");
            $("#three").attr("checked", "checked");
            earth.GlobeObserver.InitThirdTrack(180, 15);
            //判断是室内漫游还是室外漫游
            if (_tag == "enterOuter") {
                trackManager.startTracking($("#selDynamicObj").val(), 2, false);
            } else if (_tag == "enterInner") {
                trackManager.startTracking($("#selDynamicObj").val(), 2, true);
            }
            $("#head").attr("checked", "checked");
            $("#divThree").removeAttr("disabled");
            $("#divRoleDynObj").removeAttr("disabled");
            $("#btnStop").removeAttr("disabled");
            $("#btnEnterOuter").attr("disabled", "disabled");
            $("#btnEnterInner").attr("disabled", "disabled");
        });
    });
    /**
     * 退出点击事件
     */
    $("#btnStop").click(function () {
        top.Tools.cancelDisabled(top.disabledButtonArr);
        top.disableAll(false);
        $("#divRoleDynObj").attr("disabled", "disabled");
        $("#divThree :radio").removeAttr("checked");
        $("#divRoleDynObj :radio").removeAttr("checked");
        $("#btnStop").attr("disabled", "disabled");
        $("#selDynamicObj").removeAttr("disabled");
        $("#divThree").attr("disabled", "disabled");
        $("#btnEnterOuter").removeAttr("disabled");
        $("#btnEnterInner").removeAttr("disabled");
        trackManager.out($("#selDynamicObj").val());
        $("#checkBntn div", window.top.document).attr("disabled", false);
    });
    /**
     * 朝向的keyup
     */
    $("#freez0").keyup(function (evernt) {
        var thisObj = $("#freez0")[0];
        checkNum(thisObj, true, 2, 360);
        if (event.keyCode == 13) {
            $("#freez0").blur();
        }
    });
    /**
     * 俯仰的Keyup事件
     */
    $("#freez1").keyup(function (evernt) {
        var thisObj = $("#freez1")[0];
        checkNum(thisObj, false, 2, 90);
        if (event.keyCode == 13) {
            $("#freez1").blur();
        }
    });
    /**
     * 第一人称第三人称点击事件
     */
    $("#divRoleDynObj :radio").click(function () {
        $("#freez0").attr("disabled", "disabled");
        $("#freez1").attr("disabled", "disabled");
        $("#freez0").val(180);
        $("#freez1").val(15);
        $("#freez0Div").attr("disabled", "disabled");
        $("#freez1Div").attr("disabled", "disabled");
        $("#divThree :radio").removeAttr("checked");
        $("#divRoleDynObj :radio").removeAttr("checked");
        $(this).attr("checked", "checked");
        if ($(this).val() == 1) {
            trackManager.startTracking($("#selDynamicObj").val(), $(this).val());
            $("#divThree").attr("disabled", "disabled");
        }
        if ($(this).val() == 2) {
            earth.GlobeObserver.InitThirdTrack(180, 15);
            trackManager.startTracking($("#selDynamicObj").val(), 2);
            $("#head").attr("checked", "checked");
            $("#divThree").removeAttr("disabled");
        }
    });

    $("#freez0").blur(function () {
        customFreez();
    });
    $("#freez1").blur(function () {
        customFreez();
    });

    /**
     * 前方后方等radio点击事件
     */
    $("#divThree :radio").click(function () {
        $("#divThree :radio").removeAttr("checked");
        $(this).attr("checked", "checked");

        earth.GlobeObserver.InitThirdTrack(180, 15);
        trackManager.startTracking($("#selDynamicObj").val(), 2);
        if ($(this).context.id) {
            if ($(this).context.id == "low") {
                earth.GlobeObserver.ChangeThirdTrackHeading(0, $("#selDynamicObj").val());
            } else if ($(this).context.id == "left") {
                earth.GlobeObserver.ChangeThirdTrackHeading(90, $("#selDynamicObj").val());
            } else if ($(this).context.id == "right") {
                earth.GlobeObserver.ChangeThirdTrackHeading(-90, $("#selDynamicObj").val());
            } else if ($(this).context.id == "up") {
                earth.GlobeObserver.ChangeThirdTrackHeading(0, $("#selDynamicObj").val());
            } else if ($(this).context.id == "down") {
                earth.GlobeObserver.ChangeThirdTrackHeading(0, $("#selDynamicObj").val());
            } else if ($(this).context.id == "lowTop") {
                earth.GlobeObserver.ChangeThirdTrackHeading(0, $("#selDynamicObj").val());
            } else if ($(this).context.id == "head") {
                earth.GlobeObserver.ChangeThirdTrackHeading(180, $("#selDynamicObj").val());
            } else if ($(this).context.id == "free") {//自定义朝向
                $("#btnStop").blur();
                $("#freez0").removeAttr("disabled");
                $("#freez1").removeAttr("disabled");
                $("#freez0Div").removeAttr("disabled");
                $("#freez1Div").removeAttr("disabled");
                $("#freez0,#freez1").trigger("change");
                trackManager.startTracking($("#selDynamicObj").val(), 2);
            }
            if ($(this).context.id != "free") {
                $("#freez0").attr("disabled", "disabled");
                $("#freez1").attr("disabled", "disabled");
                $("#freez0").val(180);
                $("#freez1").val(15);
                $("#freez0Div").attr("disabled", "disabled");
                $("#freez1Div").attr("disabled", "disabled");
            }
        }
    });
    /**
     * 页面关闭事件，退出人称，恢复按钮状态
     */
    window.onunload = function () {
        if (earth.GlobeObserver) {
            trackManager.out($("#selDynamicObj").val());
            top.Tools.cancelDisabled(top.disabledButtonArr);
            top.disableAll(false);
        }
    };
    /**
     * 自定义朝向
     */
    function customFreez() {
        var freex = 15;
        if ($("#freez1").val() === 90) {
            freex = 89.999;
        } else if ($("#freez1").val() === -90) {
            freex = -89.999;
        } else {
            freex = $("#freez1").val() == "" ? 0 : $("#freez1").val();
        }
        earth.GlobeObserver.InitThirdTrack($("#freez0").val() == "" ? 0 : $("#freez0").val(), freex);
        trackManager.startTracking($("#selDynamicObj").val(), 2);
    }

});