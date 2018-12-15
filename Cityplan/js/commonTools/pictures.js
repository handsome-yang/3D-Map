/**
 * 作    者：StampGIS Team
 * 创建日期：2017年7月22日
 * 描    述：2.5d出图相关功能
 * 注意事项：
 * 遗留bug ：0
 * 修改日期：2017年11月14日
 ******************************************/

var earth = ""; //全局earth
var cur_num = 0; //当前数
var xmlFileName = "pictureFile";
var globalCurrentPose = null;//当前位置
var globalCurrentScreen = null;//当前屏幕坐标
var recordState = false;//出图状态
/**
 * 气泡脚本驱动执行
 * @param {Object} earthObj  三维球对象
 */
function setTranScroll(earthObj) {
	earth = earthObj;
}

/**
 * 检查是否可以开始
 * @return {[type]} [description]
 */
function checkIsStartEnable(){
	if($("#path").val() == "" || $("#heading").val() == "" 
		|| $("#tilt").val() == "" || $("#range").val() == ""
		|| $("#longitude1").val() == "" || $("#longitude2").val() == "" 
		|| $("#latitude1").val() == "" || $("#latitude2").val() == ""){
		return false;
	}else{
		return true;
	}
}

/**
 * 设置开始按钮是否禁用
 * @return {Boolean} [description]
 */
function isStartEnable(){
	if(checkIsStartEnable()){
		$("#btnStart").removeAttr("disabled");
	}else{
		$("#btnStart").attr("disabled", "disabled");
	}
}

/**
 * 屏蔽默认右键菜单
 */
document.oncontextmenu = function() {
	event.returnValue = false;
};

$(function() {
    /**
     * 开始出图
     * @return {[type]} [description]
     */
    function beginGenerateImage(path, Rectangle){
        earth.ShapeCreator.Clear();
        var totalCount = earth.ImageGenerator.Begin(path, Rectangle);
        if(totalCount > 0) {
        	recordState = true;
        	$("#currentNum").text(cur_num);
        	$("#totalNum").text(totalCount);
            earth.Event.OnDownloadFinished = function(res) {
            	if(!recordState){
            		return;
            	}
                earth.ImageGenerator.GenerateOne();
                cur_num++;
                $("#currentNum").text(cur_num);
                if(cur_num < totalCount) {
                    earth.ImageGenerator.GotoImage(cur_num);
                } else {
                    normalEndImage();
                }
            }
            earth.ImageGenerator.GotoImage(cur_num);
        }
    }

    /**
     * 正常结束出图
     * @return {[type]} [description]
     */
    function normalEndImage(){
    	recordState = false;
    	cur_num = 0;
    	$("#currentNum").text(0);
    	$("#totalNum").text(0);
        $("#btnStart").text("开始");
        enableAllInput();
    	earth.ImageGenerator.End();
        earth.Event.OnDownloadFinished = function() {};
    }

    /**
     * 点击停止按钮时保存断点文件
     * @param  {[type]} currentPose   [当前摄像头位置]
     * @param  {[type]} currentScreen [屏幕大小]
     * @param  {[type]} currentNum    [当前索引]
     * @return {[type]}               [description]
     */
    function saveMiddleFile(currentPose, currentScreen, currentNum){
    	var xmlString = "<xml>";
    	xmlString += "<currentPose>";
    	xmlString += "<X>" + currentPose.X + "</X>";
    	xmlString += "<Y>" + currentPose.Y + "</Y>";
    	xmlString += "<Z>" + currentPose.Z + "</Z>";
    	xmlString += "</currentPose>";
    	xmlString += "<currentScreen>";
    	xmlString += "<X>" + currentScreen.X + "</X>";
    	xmlString += "<Y>" + currentScreen.Y + "</Y>";
    	xmlString += "</currentScreen>";
    	xmlString += "<minLon>" + $("#longitude1").val() + "</minLon>";
    	xmlString += "<maxLon>" + $("#longitude2").val() + "</maxLon>";
    	xmlString += "<minLat>" + $("#latitude1").val() + "</minLat>";
    	xmlString += "<maxLat>" + $("#latitude2").val() + "</maxLat>";
    	xmlString += "<currentNum>" + currentNum + "</currentNum>";
    	xmlString += "<totalNum>" + $("#totalNum").text() + "</totalNum>";
    	xmlString += "<heading>" + $("#heading").val() + "</heading>";
    	xmlString += "<tilt>" + $("#tilt").val() + "</tilt>";
    	xmlString += "<range>" + $("#range").val() + "</range>";
    	xmlString += "</xml>";
    	earth.UserDocument.SaveXmlFile($("#path").val() + "/" + xmlFileName, xmlString);
    }

	$("#path").change(function() {
		isStartEnable();
	});

	$("#path").trigger("change");

	//选择路径事件
	$("#select").click(function() {
		var path = earth.UserDocument.OpenFilePathDialog("", "");
		if(!path) {
			return;
		}
		$("#path").val(path);
		isStartEnable();
	});

	//相机姿态
	$("#cameraPose").click(function() {
		$("#heading").val(earth.GlobeObserver.Pose.heading.toFixed(2));
		$("#tilt").val(earth.GlobeObserver.Pose.tilt.toFixed(2));
		$("#range").val(earth.GlobeObserver.Pose.range.toFixed(2));
	});

	//选取范围
	$("#btn_select_sector").click(function() {
		earth.Event.OnCreateGeometry = function(pval, t) {
			if(!pval || pval.Count < 3) {
				alert("至少绘制3个点");
				return;
			}
			var maxLon = 0;
			var maxLat = 0;
			var minLon = 0;
			var minLat = 0;
			maxLon = minLon = pval.Items(0).x;
			maxLat = minLat = pval.Items(0).y;
			for(var i = 1; i < pval.Count; i++) {
				var obj = pval.Items(i);
				if(obj.x > maxLon) {
					maxLon = obj.x;
				}
				if(obj.x < minLon) {
					minLon = obj.x;
				}
				if(obj.y > maxLat) {
					maxLat = obj.y;
				}
				if(obj.y < minLat) {
					minLat = obj.y;
				}
			}
			$("#longitude1").val(minLon);
			$("#longitude2").val(maxLon);
			$("#latitude1").val(minLat);
			$("#latitude2").val(maxLat);
			isStartEnable();
		};
		earth.ShapeCreator.Clear();
		earth.ShapeCreator.CreatePolygon();
	});

	//开始
	$("#btnStart").click(function() {
		if($("#btnStart").text() == "开始") {
			var path = $("#path").val();
			if(path == "") {
				alert("输出路径不能为空！");
				return;
			}
            if($("#heading").val() == "" || $("#tilt").val() == "" || $("#range").val() == ""){
                alert("请先输入相机朝向、相机俯仰和相机距离！");
                return;
            }
            if($("#longitude1").val() == "" || $("#longitude2").val() == ""
            	|| $("#latitude1").val() == "" || $("#latitude2").val() == ""){
                alert("请选择或输入正确的出图范围");
                return;
            }


			var Rectangle = getPolygonV3s();

            $("#btnStart").text("停止");
            disableAllInput();

            $("#btnMiddle").attr("disabled", "disabled");
            $("#btnClear").attr("disabled", "disabled");

            var targetPost = earth.GlobeObserver.TargetPose;
            var currentPose = earth.GlobeObserver.Pose;
            earth.GlobeObserver.GotoLookat(targetPost.Longitude, targetPost.Latitude, targetPost.Altitude, $("#heading").val(), $("#tilt").val(), currentPose.roll, $("#range").val());
            setTimeout(function(){
                beginGenerateImage(path, Rectangle);
            }, 500);
		} else if($("#btnStart").text() == "继续"){
			continueGenerateImage();
		} else {
			earth.Event.OnDownloadFinished = function() {};
			$("#btnStart").text("开始");
			earth.ImageGenerator.End();
			recordState = false;
			var currentPose = earth.ImageGenerator.CurrentPose;
			var currentScreen = earth.ImageGenerator.CurrentScreen;
			var currentNum = cur_num;
			saveMiddleFile(currentPose, currentScreen, currentNum);
			cur_num = 0;
			$("#currentNum").text(0);
			$("#totalNum").text(0);
			enableAllInput();
		}
	});

	/**
	 * 获取范围polygon
	 * @return {[type]} [description]
	 */
	function getPolygonV3s(){
	    var v3s = earth.Factory.CreateVector3s();
        var minLon = $("#longitude1").val();
		var maxLon = $("#longitude2").val();
		var minLat = $("#latitude1").val();
		var maxLat = $("#latitude2").val();
		v3s.Add(minLon, maxLat, earth.Measure.MeasureTerrainAltitude(minLon, maxLat));
		v3s.Add(maxLon, maxLat, earth.Measure.MeasureTerrainAltitude(maxLon, maxLat));
		v3s.Add(maxLon, minLat, earth.Measure.MeasureTerrainAltitude(maxLon, minLat));
		v3s.Add(minLon, minLat, earth.Measure.MeasureTerrainAltitude(minLon, minLat));
		return v3s;
	}

	//断点出图
	$("#btnMiddle").click(function(){
		//选择xml数据并解析
		var filePath = earth.UserDocument.OpenFileDialog(earth.RootPath, "xml文件(*.xml)|*.xml");
		if(filePath != ""){
			var xmlString = earth.UserDocument.LoadXmlFile(filePath);
			if(xmlString == ""){
				alert("xml文件数据错误");
				return;
			}

			//解析xml数据
			var jsonData = $.xml2json(xmlString);
			if(jsonData == null || jsonData == "" || jsonData.currentPose == undefined 
				|| jsonData.currentPose.X == undefined || jsonData.currentPose.Y == undefined 
				|| jsonData.currentPose.Z == undefined || jsonData.currentScreen == undefined
				|| jsonData.currentScreen.X == undefined || jsonData.currentScreen.Y == undefined 
				|| jsonData.minLon == undefined || jsonData.maxLon == undefined 
				|| jsonData.minLat == undefined || jsonData.maxLat == undefined 
				|| jsonData.currentNum == undefined || jsonData.totalNum == undefined
				|| jsonData.heading == undefined || jsonData.tilt == undefined
				|| jsonData.range == undefined){
				alert("xml文件数据错误");
			}
			var pathName = filePath.substr(0, filePath.lastIndexOf("\\"));
			globalCurrentPose = jsonData.currentPose;
			globalCurrentScreen = jsonData.currentScreen;

			//给输入框赋值
			$("#path").val(pathName);
			$("#heading").val(jsonData.heading);
			$("#tilt").val(jsonData.tilt);
			$("#range").val(jsonData.range);
			$("#longitude1").val(jsonData.minLon);
			$("#longitude2").val(jsonData.maxLon);
			$("#latitude1").val(jsonData.minLat);
			$("#latitude2").val(jsonData.maxLat);
			$("#currentNum").text(jsonData.currentNum);
			$("#totalNum").text(jsonData.totalNum);
			cur_num = parseInt(jsonData.currentNum);

			disableAllInput();
			$("#btnStart").removeAttr("disabled");
			$("#btnStart").text("继续");
		}
	});

	/**
	 * 使所有参数可用
	 * @return {[type]} [description]
	 */
	function enableAllInput(){
		$("#heading").removeAttr("disabled");
		$("#tilt").removeAttr("disabled");
		$("#range").removeAttr("disabled");

		$("#longitude1").removeAttr("disabled");
		$("#longitude2").removeAttr("disabled");
		$("#latitude1").removeAttr("disabled");
		$("#latitude2").removeAttr("disabled");
		$("#select").removeAttr("disabled");
		$("#btn_select_sector").removeAttr("disabled");
		$("#cameraPose").removeAttr("disabled");

		isStartEnable();
		$("#btnClear").removeAttr("disabled");
		$("#btnMiddle").removeAttr("disabled");
	}

	/**
	 * 禁用所有参数输入
	 * @return {[type]} [description]
	 */
	function disableAllInput(){
		$("#heading").attr("disabled", "disabled");
		$("#tilt").attr("disabled", "disabled");
		$("#range").attr("disabled", "disabled");

		$("#longitude1").attr("disabled", "disabled");
		$("#longitude2").attr("disabled", "disabled");
		$("#latitude1").attr("disabled", "disabled");
		$("#latitude2").attr("disabled", "disabled");
		$("#select").attr("disabled", "disabled");
		$("#btn_select_sector").attr("disabled", "disabled");
		$("#cameraPose").attr("disabled", "disabled");
	}

	/**
	 * 继续出图
	 * @return {[type]}               [description]
	 */
	function continueGenerateImage(){
		$("#btnStart").text("停止");
		$("#btnClear").attr("disabled", "disabled");
		$("#btnMiddle").attr("disabled", "disabled");
		var totalCount = $("#totalNum").text();
		recordState = true;
		earth.ImageGenerator.Resume($("#path").val(), getPolygonV3s(), globalCurrentScreen.X, globalCurrentScreen.Y, globalCurrentPose.X, globalCurrentPose.Y, globalCurrentPose.Z );
		earth.Event.OnDownloadFinished = function(res) {
			if(!recordState){
        		return;
        	}
			earth.ImageGenerator.GenerateOne();
			cur_num++;
			$("#currentNum").text(cur_num);
			if( cur_num < totalCount ) {
				earth.ImageGenerator.GotoImage(cur_num);
			} else {
				normalEndImage();
			}
		}
		earth.ImageGenerator.GotoImage(cur_num);
	}

	//清除重置
	$("#btnClear").click(function() {
		earth.ShapeCreator.Clear();
		clearAll();
	});

	/**
	 * 清除数据
	 * @return {[type]} [description]
	 */
	function clearAll(){
		$("#btnStart").attr("disabled", "disabled");
		$("#btnStart").text("开始");

		$("#path").val("");
		$("#heading").val("");
		$("#tilt").val("");
		$("#range").val("");

		$("#longitude1").val("");
		$("#longitude2").val("");
		$("#latitude1").val("");
		$("#latitude2").val("");

		$("#currentNum").text(0);
		$("#totalNum").text(0);
		currentNum = 0;

		$("#heading").removeAttr("disabled");
		$("#tilt").removeAttr("disabled");
		$("#range").removeAttr("disabled");

		$("#longitude1").removeAttr("disabled");
		$("#longitude2").removeAttr("disabled");
		$("#latitude1").removeAttr("disabled");
		$("#latitude2").removeAttr("disabled");

		$("#select").removeAttr("disabled");
		$("#btn_select_sector").removeAttr("disabled");
		$("#cameraPose").removeAttr("disabled");
		$("#btnMiddle").removeAttr("disabled");
	}

	//直接关闭窗口
	window.onunload = function(){
		if(recordState){
			earth.ImageGenerator.End();
	        earth.Event.OnDownloadFinished = function() {};
	        var currentPose = earth.ImageGenerator.CurrentPose;
			var currentScreen = earth.ImageGenerator.CurrentScreen;
			var currentNum = cur_num;
			saveMiddleFile(currentPose, currentScreen, currentNum);	
		}
	}
});