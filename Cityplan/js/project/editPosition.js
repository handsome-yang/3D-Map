/**
 * 作    者：StampGIS Team
 * 创建日期：2017年8月14日
 * 描    述：位置调整
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月10日
 */

var earth;//三维球
var editTool;//编辑工具对象
var action = "";//编辑状态：move移动， rotate旋转，scale 缩放

/*
 * 外部传参初始化
 * @param earthObj 参数集合
 */
function getEarth(earthObj){
    //变量参数赋值
    earth=earthObj;
    editTool= earth.editTool;
    //外部方法参数赋值
    var setSelectStatus = earth.setSelectStatus;

    init(); //该方法须放在getEarth中 fixed by zc 2014-08-01 19:29:15

    //退出
    $("#clear").click(function(){
        earth.Event.OnPoseChanged = function(){};
        editTool.clearMenuStyle();
        editTool.clearHtmlBallon(earth.htmlBallon);
        earth.SelectSet.UnLockSelectSet();
        earth.ToolManager.SphericalObjectEditTool.Browse();
    });

    //注册按键输入事件
    $("#txtXValue,#txtYValue,#txtZValue").bind("keydown", onkeydown);
    $("#txtXValue,#txtYValue,#txtZValue").bind('keypress', onkeyup);
    
    //操作切换按钮事件
    $("#OperFunction :radio").click(function(){
        $("#OperFunction :radio").removeAttr("checked");
        $(this).attr("checked", "checked");
        var opType = $(this).val();
        if(opType == 1){//1为鼠标操作
            $("#txtXValue").attr("disabled", "disabled");
            $("#txtYValue").attr("disabled", "disabled");
            $("#txtZValue").attr("disabled", "disabled");
            $("#btnOk").attr("disabled", "disabled");
            earth.ToolManager.SphericalObjectEditTool.Move(7);//x、y、z轴全部可以移动
            setSelectStatus(true, "editPosition");//重置选取状态
        }else{//0为精确操作
            $("#txtXValue").removeAttr("disabled");
            $("#txtYValue").removeAttr("disabled");
            $("#txtZValue").removeAttr("disabled");
            $("#btnOk").removeAttr("disabled");
            earth.ToolManager.SphericalObjectEditTool.Select();
        }
    });

    //贴地按钮事件
    $("#toUnderground").click(function(){
        editTool.alignGround();
        if($("#OperFunction :radio").eq(0).attr("checked") == "checked"){//说明是鼠标操作
            earth.ToolManager.SphericalObjectEditTool.Move(7);//x、y、z轴全部可以移动
            setSelectStatus(false, "editPosition");//重置选取状态
        }else{//说明是精确操作
            earth.ToolManager.SphericalObjectEditTool.Select();
        }
    });
}

//页面卸载
$(window).unload(function () {
    earth.SelectSet.UnLockSelectSet();
    earth.ToolManager.SphericalObjectEditTool.Browse();
});

/*
 * 初始化参数值
 */
function init(){
    var params = location.href.split("?");
    var param;
    var labels = {"move":"移动", "rotate":"旋转", "scale":"缩放"};
    var units = {"move":"米","rotate":"度","scale":""};
    if(params.length == 2){
        param = params[1];
        action = param.split("=")[1];
        document.title=labels[action];
        $("#lblX").text(labels[action] + "(X轴)");
        $("#lblY").text(labels[action] + "(Y轴)");
        $("#lblZ").text(labels[action] + "(Z轴)");

        $('#unit0,#unit1,#unit2').text(units[action]);
    }
}

/*
 * 确定事件
 */
function doAction() {
    $("#clear").focus();
    if(earth.SelectSet.GetCount() <= 0){
        alert("请先选择方案模型");
        return;
    }
    var valueX = $("#txtXValue").val();
    var valueY = $("#txtYValue").val();
    var valueZ = $("#txtZValue").val();
    if(isNaN(valueX)||isNaN(valueY)||isNaN(valueZ)){
        alert("请输入数字!");
        return;
    }
    if(action == 'scale'){
        if(valueX <= 0 || valueY <= 0 || valueZ <= 0){
            alert('缩放比例应大于0');
            return;
        }
    }
    var actions = {"move":editTool.moveByValue, "rotate":editTool.rotateByValue, "scale":editTool.scaleByValue};
    if(actions[action]){
        actions[action](valueX, valueY, valueZ);
    }
    $("#txtXValue").val(0);
    $("#txtYValue").val(0);
    $("#txtZValue").val(0);
}

/*
 * 获取偏移值-供外部调用
 * @param params 外部传入偏移值参数
 */
function GetReturnValue(params) {
    $("#txtXValue").val(params[0].toFixed(2));
    $("#txtYValue").val(params[1].toFixed(2));
    $("#txtZValue").val(params[2].toFixed(2));
}

/*
 * 按键按起事件
 */
function onkeyup(event){
    if(event.keyCode >= 48 && event.keyCode <= 57 || 
        event.keyCode == 8 || event.keyCode == 46 || 
        event.keyCode == 127){

    }else if(event.keyCode == 45){
        if(action == 'scale'){
            event.preventDefault();
        }
    }else{
        event.preventDefault();
    }
}

/*
 * 按键按下事件
 */
function onkeydown(event){
    if(!checkKeyCode(event.keyCode)){
        event.preventDefault();
    }
}

/*
 * 检查输入字符
 */
function checkKeyCode(keyCode){
    if(isNaN(keyCode)){
        return false;
    }

    if(keyCode >= 48 && keyCode <= 57){
        //主键盘数字键
        return true;
    }
    if(keyCode >= 96 && keyCode <= 105){
        //小键盘数字键
        return true;
    }
    if(keyCode == 13){
        //主键盘回车键
        return true;
    }
    if(keyCode == 108){
        //小键盘回车键
        return true;
    }
    if(keyCode == 189){
        //主键盘'-'号
        return true;
    }
    if(keyCode == 109){
        //小键盘'-'号
        return true;
    }
    if(keyCode == 8){
        //backspace
        return true;
    }
    if(keyCode == 46){
        //delete
        return true;
    }
    if(keyCode >= 37 && keyCode <= 40){
        //方向键
        return true;
    }
    if (keyCode == 190) {
        //主键盘'.'
        return true;
    }
    if (keyCode == 110) {
        //小键盘'.'
        return true;
    }

    return false;
}