/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月14日
 * 描    述：指标比对的指标页面
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月14日
 *****************************************************************/
//全局变量
var curYDName = "";//当前用地名称
var plan = [];//方案数组

/*
 * 外部传参方法
 * @param paramValue 外部传入参数
 * @return 无
 */
function setTranScroll(paramValue){
    //参数赋值
    curYDName = paramValue.curPlanYDName;//当前用地名称
    var planData = paramValue.planData;
    var setCurPlanYDName = paramValue.setCurPlanYDName;
    var id = paramValue.id;
    var curPlanData = null;

    //方案ID不能为空
    if(id == null || id == undefined || id == ""){
        $("#trYongDi").remove();
        $("#planTitle").text("现状");
        return;
    }

    //方案详细信息数组
    for(var i=0;i<planData.length;i++){
        if(id===planData[i].id){
           plan.push(planData[i].plan);
        }
    }

    //方案信息数组不能为空
    if(plan == null || plan.length <= 0){
        $("#trYongDi").remove();
        $("#planTitle").text("现状");
        return;
    }

    //用地select填值
    for(var i = 0; i < plan.length; i++){
        if(plan[i]["CPPLAN.YDNAME"] == curYDName){
            $("#yongDiName").append('<option value="' + plan[i]["CPPLAN.YDNAME"] + '" selected>' + plan[i]["CPPLAN.YDNAME"] + '</option>');
            curPlanData = plan[i];
        }else{
            $("#yongDiName").append('<option value="' + plan[i]["CPPLAN.YDNAME"] + '">' + plan[i]["CPPLAN.YDNAME"] + '</option>');    
        }
    }

    //用地select改变事件
    $("#yongDiName").change(function(){
        curYDName = $(this).find('option:selected').text();
        setCurPlanYDName(curYDName);
    });

    //方案当前用地名称为空时设置第一个为当前方案
    if(curYDName == null || curYDName == undefined){
        //当前方案
        curYDName = plan[0]["CPPLAN.YDNAME"];    
        curPlanData = plan[0];
    }

    if(curYDName){//方案当前用地不为空
        $("#planTitle").text("方案:" + curPlanData["CPPLAN.NAME"]);
        //加载方案数据
        loadDataGrid(curPlanData);
    }else{//方案当前用地为空时，说明是现状
        $("#planTitle").text("现状");
    }
}
/*功能：设置数字显示精度
 *@param pValue 原始的数字字符串
 *@return 截取之后的字符串
 */
function resetNumDisplay(pValue) {
    if (pValue.indexOf(".") == 0) {
        pValue = "0" + pValue;
    }
    pValue = parseFloat(pValue).toFixed(2);
    return pValue;
}
/*功能：加载表格数据
 *@param plan 方案指标数据
 *@return 无
 */
function loadDataGrid(planIndex){
    var data = {
        title:9,
        rows: []
    };
    data.rows.push({"lx":"名称","sj":(planIndex["CPPLAN.NAME"] || ""),"dw":""});
    data.rows.push({"lx":"规划总用地","sj":(resetNumDisplay(planIndex["CPPLAN.GHZYD"]) || ""),"dw":"平方米"});
    data.rows.push({"lx":"规划净用地","sj":(resetNumDisplay(planIndex["CPPLAN.GHJYD"]) || ""),"dw":"平方米"});
    data.rows.push({"lx":"建筑总面积","sj":(resetNumDisplay(planIndex["CPPLAN.ZJZMJ"])  || ""),"dw":"平方米"});
    data.rows.push({"lx":"建筑密度","sj":(resetNumDisplay(planIndex["CPPLAN.JZMD"]) || ""),"dw":"%"});
    data.rows.push({"lx":"容积率","sj":(resetNumDisplay(planIndex["CPPLAN.RJL"]) || ""),"dw":"--"});
    data.rows.push({"lx":"绿地率","sj":(resetNumDisplay(planIndex["CPPLAN.LDL"]) || ""),"dw":"%"});

    $("#viewpointList").datagrid("loadData",data);
}

/*功能：修改选择的用地---必须写在外面，供外部调用
 *@param ydName 用地名称
 */
function changeSelectYDName(ydName){
    curYDName = ydName;
    $("#yongDiName").val(curYDName);
    if(plan == null || plan == ""){
        return;
    }
    for(var i = 0; i < plan.length; i++){
        if(plan[i]["CPPLAN.YDNAME"] == curYDName){
            loadDataGrid(plan[i]);
            break;        
        }
    }
}

