/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月07日
 * 描    述：挖填方分析
 * 注意事项：该文件方法仅为挖填方分析使用
 * 遗留bug ：暂时调整为按绝对高程开挖,等到按矢量面开挖完成后再开放
 * 修改日期：2017年11月07日
 ******************************************************************/
var earth = ""; //三维球
var spatialDatum = null; //基准面
// 解决IE8-IE11的兼容性问题
var str = window.navigator.userAgent;
if(/MSIE 8.0/.test(str)){
    $("#altitude").attr('onpropertychange','checkNum(this,false,2)');
}else{
    $("#altitude").attr('oninput','checkNum(this,false,2)');

};
function getEarth(earthObj) {
	earth = earthObj;
	spatialDatum = earthObj.datum;
	var analysis = STAMP.Analysis(earth); //全局分析对象
	$(function() {
		//radio切换事件
		//事件委托click
		$("table").on("click", "input:radio", function(e) {
			if($(this).val() == "1") { //按深度开挖
				$("#defaultHide").css("display","none");
				$("#defaultShow").css("display","");

				$("#altitude").removeAttr("disabled");
				$("#altitude").val(5);
				$("#vectorSelect").attr("disabled", true);
				$("#shpPath").val("");
				if($("#altitude").val() != "") {
					$("#btnStart").attr("disabled", false);
				}
				$("#wafang").val("");
				$("#tianfang").val("");
			} else if($(this).val() == "2") { //按矢量面开挖
				$("#defaultShow").css("display","none");
				$("#defaultHide").css("display","");

				$("#vectorSelect").removeAttr("disabled");
				$("#altitude").attr("disabled", true);
				$("#altitude").val("");
				$("#btnStart").attr("disabled", true);
				$("#wafang").val("");
				$("#tianfang").val("");
			}
		});

		//选择文件
		$("#vectorSelect").click(function() {
			var filePath = earth.UserDocument.OpenFileDialog(earth.RootPath, "SHP文件(*.shp)|*.shp");
			if(filePath == "") {
				return;
			}
			$("#shpPath").attr("value", filePath);
			$("#btnStart").attr("disabled", false);

		});

		//控制开始分析按钮状态
		$("#altitude").keyup(function(event) {
			var alt = $("#altitude").val()
			if(alt == "") {
				$("#btnStart").attr("disabled", true);
			} else {
				$("#btnStart").attr("disabled", false);
			}
		});

		// 开始分析
		$("#btnStart").click(function() {
			if(check()) {
				var altitude = parseInt($("#altitude").val());
				if($("#btnStart").text() === "开始分析") {

					var isCustomer = $("#customer").is(":checked"); //是否按深度开挖

					$("#btnStart").attr("disabled", "disabled");
					if(isCustomer) {
						analysis.excavationAndFill(altitude, chkDem.checked, digDem.checked);
					} else {
						var path = $("#shpPath").val();
						if(path) {
							var pathStr = path.split(".");
							var type = pathStr[pathStr.length - 1];
							if(type != "dwg" && type != "dxf" && type != "shp") {
								alert("矢量文件格式不正确,请重新选择文件!");
								return false;
							}
							var exp = STAMP.ExportSHP(earth); //digDem开挖地面模型，checkDem生成辅助模型
							var polygon = exp.importFile(path, null, type, null, spatialDatum, true);
							analysis.vectorExcaveAndFill(polygon, chkDem.checked, digDem.checked)
						} else {
							alert("请导入矢量文件");
							return;
						}
					}

				}
			}
		});
		// 退出
		$("#clear").click(function() {
			analysis.clearHtmlBallon(earth.htmlBallon);
		});

	});

	window.onunload = function() {
		analysis.clear();
	};
}

function check() {
	if($("#customer").attr("checked") == "checked" || $("#customer").attr("checked") == true) {
		if(isNaN($("#altitude").val()) == true || $("#altitude").val() == "") {
			alert("无效的开挖深度");
			altitude.select();
			altitude.focus();
			return false;
		}
	}
	return true;
}