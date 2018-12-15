/**
 * 作    者：StampGIS Team
 * 创建日期：2017年8月29日
 * 描    述：漫游页面脚本
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月9日
 */
$(function (){
    var earth = top.LayerManagement.earth;
    var trackManager = STAMP.TrackManager(earth);
    var enterFlag = false;//防止按enter触发两次事件

    $("#divThree :radio").removeAttr("checked");

    // 初始化动态对象列表
    trackManager.getDynamicObject(function (dynamic){
        $("#selDynamicObj").append('<option value="' + dynamic.Guid + '">' + dynamic.Name + '</option>');
    },function (fly){
        $("#selFlyObj").append('<option value="' + fly.Guid + '">' + fly.Name + '</option>');
    });
    
    /**
     * 检查输入的朝向值
     * @return {[type]} [description]
     */
    function checkF0(){
        var fr0Val = $("#freez0").val();
        if(fr0Val<0 || fr0Val>360){
            alert("请输入范围内的朝向值！");
            return false;
        }else{
            return true;
        }
    }

    /**
     * 检查输入的俯仰值
     * @return {[type]} [description]
     */
    function checkF1(){
        var fr1Val = $("#freez1").val();
        fr1Val = Math.abs(fr1Val)
        if(fr1Val>90){
            alert("请输入范围内的俯仰值！");
            return false;
        }else{
            return true;
        }
    }

    /**
     * 自定义角度
     * @return {[type]} [description]
     */
    function customFreez(){
        var freex= 15;
        if($("#freez1").val() === 90){
            freex = 89.999;
        }  else if($("#freez1").val() === -90){
            freex = -89.999;
        }else{
            freex = $("#freez1").val() == ""?0:$("#freez1").val();
        }
        earth.GlobeObserver.InitThirdTrack($("#freez0").val()==""?0:$("#freez0").val(),freex);
        trackManager.startTracking($("#selDynamicObj").val(), 2);
    }

    //动态物体
    $("#btnEnterOuter,#btnEnterInner").click(function (){
        top.Tools.disabledAll();
        top.disableAll(true);
        $("#selDynamicObj").attr("disabled", "disabled");
        var _tag = $(this).attr("tag");
        trackManager.enterTrack($("#selDynamicObj").val(), function (reValue){
            if(!reValue){
                $("#selDynamicObj").removeAttr("disabled");
                top.Tools.cancelDisabled(top.disabledButtonArr);
                top.disableAll(false);
                return;
            }
            $("#freez0").attr("disabled","disabled");
            $("#freez1").attr("disabled","disabled");
            $("#freez0").val(180);
            $("#freez1").val(15);
            $("#freez0Div").attr("disabled","disabled");
            $("#freez1Div").attr("disabled","disabled");
            $("#checkBntn div",window.top.document).attr("disabled", true);
            $("#divRoleDynObj :radio").removeAttr("checked");
            $("#three").attr("checked", "checked");
            earth.GlobeObserver.InitThirdTrack(180,15);
            //判断是室内漫游还是室外漫游
            if(_tag == "enterOuter"){
                trackManager.startTracking($("#selDynamicObj").val(), 2, false);
            } else if(_tag == "enterInner"){
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
    
    //朝向
    $("#freez0").keyup(function (evernt) {
        var thisObj = $("#freez0")[0];
        var thisValue = thisObj.value;
        thisValue = thisValue.replace(/[^0-9.]/g,'');
        $("#freez0").val(thisValue);
        enterFlag = false;
        if(event.keyCode == 13){
            enterFlag = true;
            $("#freez0").blur();
            $("#freez1").blur();
        }
    });

    //俯仰
    $("#freez1").keyup(function (evernt) {
        var thisObj = $("#freez1")[0];
        var thisValue = thisObj.value;
        thisValue = thisValue.replace(/[^0-9.-]/g,'');
        $("#freez1").val(thisValue);
        enterFlag = false;
        if(event.keyCode == 13){
            enterFlag = true;
            $("#freez0").blur();
            $("#freez1").blur();
        }
    });

    //停止
    $("#btnStop").click(function (){
        top.Tools.cancelDisabled(top.disabledButtonArr);
        top.disableAll(false);
        $("#divRoleDynObj").attr("disabled", "disabled");
        $("#divThree :radio").removeAttr("checked");
        $("#divRoleDynObj :radio").removeAttr("checked");
        $("#btnStop").attr("disabled", "disabled");
        $("#selDynamicObj").removeAttr("disabled");
        $("#divThree").attr("disabled","disabled");
        $("#btnEnterOuter").removeAttr("disabled");
        $("#btnEnterInner").removeAttr("disabled");
        trackManager.out($("#selDynamicObj").val());
        $("#checkBntn div",window.top.document).attr("disabled", false);
    });

    //人称视角切换
    $("#divRoleDynObj :radio").click(function (){
        $("#freez0").attr("disabled","disabled");
        $("#freez1").attr("disabled","disabled");
        $("#freez0").val(180);
        $("#freez1").val(15);
        $("#freez0Div").attr("disabled","disabled");
        $("#freez1Div").attr("disabled","disabled");
        $("#divThree :radio").removeAttr("checked");
        $("#divRoleDynObj :radio").removeAttr("checked");
        $(this).attr("checked", "checked");
        if($(this).val()==1 ){
            trackManager.startTracking($("#selDynamicObj").val(), $(this).val());
            $("#divThree").attr("disabled","disabled");
        }
        if($(this).val()==2){
            earth.GlobeObserver.InitThirdTrack(180,15);
            trackManager.startTracking($("#selDynamicObj").val(), 2);
            $("#head").attr("checked", "checked");
            $("#divThree").removeAttr("disabled");
        }
    });

    //朝向输入框失去焦点后事件
    $("#freez0").blur( function(){
        if(checkF0() && checkF1()){
            customFreez();
        }
    });

    //俯仰输入框失去焦点后事件
    $("#freez1").blur( function(){
        if(checkF0() && checkF1()){
            customFreez();
        }
    });

    //前后左右自定义切换按钮事件
    $("#divThree :radio").click(function (){
        $("#divThree :radio").removeAttr("checked");
        $(this).attr("checked", "checked");

        earth.GlobeObserver.InitThirdTrack(180,15);
        trackManager.startTracking($("#selDynamicObj").val(), 2);
        if($(this).context.id){
            if($(this).context.id=="low"){
                earth.GlobeObserver.ChangeThirdTrackHeading(0, $("#selDynamicObj").val());
            } else if($(this).context.id=="left"){
                earth.GlobeObserver.ChangeThirdTrackHeading(90, $("#selDynamicObj").val());
            } else if($(this).context.id=="right"){
                earth.GlobeObserver.ChangeThirdTrackHeading(-90, $("#selDynamicObj").val());
            }else if($(this).context.id=="up"){
                earth.GlobeObserver.ChangeThirdTrackHeading(0, $("#selDynamicObj").val());
            }else if($(this).context.id=="down"){
                earth.GlobeObserver.ChangeThirdTrackHeading(0, $("#selDynamicObj").val());
            }else if($(this).context.id=="lowTop"){
                earth.GlobeObserver.ChangeThirdTrackHeading(0, $("#selDynamicObj").val());
            } else if($(this).context.id=="head"){
                earth.GlobeObserver.ChangeThirdTrackHeading(180, $("#selDynamicObj").val());
            }else if($(this).context.id=="free"){
                $("#freez0").removeAttr("disabled");
                $("#freez1").removeAttr("disabled");
                $("#freez0Div").removeAttr("disabled");
                $("#freez1Div").removeAttr("disabled");
                $("#freez0,#freez1").trigger("change");
                trackManager.startTracking($("#selDynamicObj").val(), 2);
            }
            if($(this).context.id!="free"){
                $("#freez0").attr("disabled","disabled");
                $("#freez1").attr("disabled","disabled");
                $("#freez0").val(180);
                $("#freez1").val(15);
                $("#freez0Div").attr("disabled","disabled");
                $("#freez1Div").attr("disabled","disabled");
            }
        }
    });
    
    window.onunload = function (){
        if(earth.GlobeObserver){
            trackManager.out($("#selDynamicObj").val());
            top.Tools.cancelDisabled(top.disabledButtonArr);
            top.disableAll(false);
        }
    };

});