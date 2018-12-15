/**
 * 作    者：StampGIS Team
 * 创建日期：2017年8月14日
 * 描    述：建筑方位调整
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月10日
 */

var earth;//三维球对象
var editTool;//编辑工具对象

/*
 *外部初始化传参
 *@param earthObj 参数对象
 *@return 无
 */
function getEarth(earthObj){
    //全局变量赋值
    earth=earthObj;
    editTool= earth.editTool;
    var setSelectStatus = earth.setSelectStatus;
    //确定按钮点击事件
    $("#btnAction").click(function(){
    	var roY = $("#planRotate").val();
		if(isNaN(roY)){
			alert("请输入数字!");
			return;
		}

		if(roY == null || roY == ""){
			roY = 0;
		}

        editTool.editProgrammeValue(roY);
    });
    
    //退出按钮点击事件
    $("#clear").click(function(){
        editTool.clearMenuStyle();
        editTool.clearHtmlBallon(earth.htmlBallon);
        earth.SelectSet.UnLockSelectSet();
        earth.ToolManager.SphericalObjectEditTool.Browse();
    });
    
    //页面卸载
    $(window).unload(function () {
        earth.ToolManager.SphericalObjectEditTool.Browse();
    });

    //贴地按钮点击事件
    $("#toUnderground").click(function(){
        editTool.alignGround();
        if($("#OperFunction :radio").eq(0).attr("checked") == "checked"){//说明是鼠标操作
            earth.ToolManager.SphericalObjectEditTool.Rotate(2);//Y轴旋转
            setSelectStatus(false, "editProgramme");//重置选取状态
        }else{//说明是精确操作
            earth.ToolManager.SphericalObjectEditTool.Select();
        }
    });

    //操作按钮切换事件
    $("#OperFunction :radio").click(function(){
        $("#OperFunction :radio").removeAttr("checked");
        $(this).attr("checked", "checked");
        var opType = $(this).val();
        if(opType == 1){//鼠标操作
            $("#planRotate").attr("disabled", "disabled");
            $("#btnAction").attr("disabled", "disabled");
            earth.ToolManager.SphericalObjectEditTool.Rotate(2);//Y轴旋转
            setSelectStatus(true, "editProgramme");//重置选取状态
        }else{//精准操作
            $("#planRotate").removeAttr("disabled");
            $("#btnAction").removeAttr("disabled");
            earth.ToolManager.SphericalObjectEditTool.Select();
        }
    });
}

//鼠标操作返回旋转值
function GetReturnValue(rotateYOff) {
    $("#planRotate").val(rotateYOff.toFixed(2));
}