/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月8日
 * 描    述：左侧面板的方法
 * 注意事项：可存放左侧面板相关方法
 * 遗留bug ：无
 * 修改日期：2017年11月8日
 */

var dialogId = null;//当前打开的左侧面板ID
var menuItem = null;//当前打开的面板所属菜单项

/**
 * 打开左侧面板
 * @param  {[string]} src [面板显示的html页面]
 * @param  {[string]} id  [即将打开的面板所属菜单ID]
 * @return {[type]}     [description]
 */
window.showDialog = function(src, id) {
	if(id!="QueryProperty" && id == dialogId){//除了属性查询，其他菜单点击第二次时关闭面板
        LayerManagement.clearSearchResult();
		closeDialog();
		return;
	}
    if(dialogId){
        if(dialogId == "LayerManager"){//图层管理在工具栏上，需要特殊处理
            BalloonHtml.removeItemStyle("LayerManager");
        }else{//关闭当前打开的左侧面板所属菜单按钮样式
            Tools.singleStyleCancel(dialogId);
        }
    }
    Tools.singleSelectedStyle(id);//设置菜单按钮为选中状态
    dialogId = id;//修改当前打开面板的菜单ID

    LayerManagement.clearHtmlBalloons();//清除气泡
	if($("#leftPanel").is(":hidden")){
		setLayerShow(true);//显示左侧面板
	}

    var title = "";
    var titleImg = "";
    var bFind = false;//标示-查找到即将打开菜单的对象
    for(var i = 0; i < lefts.config.menu.length; i++){//找到对应的菜单，并设置面板标题和图标
        for(var j = 0; j < lefts.config.menu[i].item.length; j++){
            if(lefts.config.menu[i].item[j].id == id){//查找第一级
                title = lefts.config.menu[i].item[j].title;
                titleImg = lefts.config.menu[i].item[j].src;
                menuItem = lefts.config.menu[i].item[j];
                bFind = true;
                break;
            }
            if(lefts.config.menu[i].item[j].item && lefts.config.menu[i].item[j].item.length > 0){
                for(var k = 0; k < lefts.config.menu[i].item[j].item.length; k++){
                    if(lefts.config.menu[i].item[j].item[k].id == id){//查找第二级
                        title = lefts.config.menu[i].item[j].item[k].title;
                        titleImg = lefts.config.menu[i].item[j].item[k].src;
                        menuItem = lefts.config.menu[i].item[j].item[k];
                        bFind = true;
                        break;
                    }
                }
            }
            if(bFind){//找到即停止查找
                break;
            }
        }
        if(bFind){//找到即停止查找
            break;
        }
    }

    //属性查询和图层管理在工具栏，不在菜单配置文件中，需要特殊处理
    if(id == "QueryProperty"){//属性查询
        title = "属性查询";
        titleImg = "images/tools/属性查询.png";
    }else if(id == "LayerManager"){//图层管理
        title = "图层管理";
        titleImg = "images/tools/图层管理.png";
    }

    //功能面板设置
    $("#id_left_operator").show();
    $("#id_left_operator").dialog({//弹出功能面板对话框
        shadow: false,
        draggable: false,
        title: title,
        titleImg: titleImg,
        onClose: function() {//关闭功能面板对话框
            LayerManagement.clearSearchResult();
            $("#id_left_operator").hide();
			$("#operator").attr("src", "");
			LayerManagement.clearHtmlBalloons();
			Tools.singleStyleCancel(dialogId);
            BalloonHtml.removeItemStyle(dialogId);
            dialogId = null;//关闭时当前面板ID设置为空
        }
    }).panel({//对话框大小
        height: $(document).height() - STAMP_config.height.bannerHeight,
        width: STAMP_config.height.leftPanelWidth
    }).panel("move", {//对话框位置
        top: STAMP_config.height.bannerHeight + "px",
        left: "0px"
    });
    $("#operator").attr("src", src);//对话框url页面
}

/**
 * 关闭功能面板对话框
 * @return {[type]} [description]
 */
function closeDialog(){
	if($("#id_left_operator").css("display") != "none"){
		$("#id_left_operator").hide();
		$("#id_left_operator").dialog('close');
        if(dialogId){
            Tools.singleStyleCancel(dialogId);
            dialogId = null;
        }
	}
}

/**
 * 点击方案管理打开方案面板
 * @param  {[bool]} bFlag [是否显示方案管理面板：true和false]
 * @return {[type]}       [description]
 */
function showProjectManager(bFlag){
	//先隐藏功能面板和图层管理面板
	if(!$("#id_left_operator").is(":hidden")){
		$("#id_left_operator").hide();
    	$("#id_left_operator").dialog("close");
	}
    if(bFlag){
    	setLayerShow(true);	
    	//显示项目管理面板
    	$("#id_left_operator_1").show();	
    }else{
		setLayerShow(false);	
    }
}

/**
 * 关闭左侧面板
 */
$("#closeLayer").click(function(){
    showLeftPanel(false);
});

/**
 * 显示隐藏左侧面板
 * @param  {[bool]} bFlag [true或false]
 * @return {[type]}       [description]
 */
function showLeftPanel(bFlag){
    setLayerShow(bFlag);//缩进图层面板
    if(earthToolsDiv){//修改工具栏上的方案管理按钮状态
        if(bFlag){
            BalloonHtml.setItemStyle("projectManage");
        }else{
            BalloonHtml.removeItemStyle("projectManage");
        }
    }
}

/**
 * 设置左侧图层面板是否显示
 * @param {[type]} show [show:true显示，show:false不显示]
 */
function setLayerShow(show){
    if(show){
        $("#leftPanel").show();
        $("#mainEarth").css("margin-left", STAMP_config.height.leftPanelWidth + "px");
    }else{
        $("#leftPanel").hide();
        $("#mainEarth").css("margin-left","0px");
    }
    setToolsIconStatus();
}