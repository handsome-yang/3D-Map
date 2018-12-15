/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月9日
 * 描    述：自定义管线分析（智能排管）
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月9日
 */

var UserDataAnalysis={};
var mContainer=[];//存放所有的自定义创建管线模型对象
$(function(){
	var name=null;
	var imgLocation = getSystemPath() + "/images/PipeMaterial/Standard/",
    sideTexturePath = imgLocation + "white.jpg";
	var pipelineTypes = PipelineStandard.PipelineType;
	/**
	 * 自定义创建管线（智能排管）
	 * @param  {[tring]} vec3s         [管线起始点]
	 * @param  {[tring]} specification [半径]
	 * @param  {[tring]} pipeLineName  [管线名称]
	 * @param  {[tring]} type          [管线类型]
	 * @param  {[string]} pipelineId    [管线ID]
	 * @return {[object]}               [创建的管线对象]
	 */
	var createPipeLine = function(vec3s,specification,pipeLineName,type,pipelineId){
		name = pipeLineName;
		var pipeLineTypeValue = pipelineTypes[type];
		sideTexturePath = imgLocation + pipeLineTypeValue+".jpg";
		return createModel(vec3s,specification,type,pipelineId);
	};

	/**
	 * 创建模型
	 * @param  {[type]} args          [管线起始点]
	 * @param  {[type]} specification [半径]
	 * @param  {[type]} type          [管线类型]
	 * @param  {[type]} modelGuid     [管线模型guid]
	 * @return {[type]}               [管线模型对象]
	 */
    var createModel = function (args,specification,type,modelGuid) {
    	// 生成边缘模型
        var terrain = earth.TerrainManager;
        if(modelGuid == null){
            modelGuid=earth.Factory.CreateGUID();
        }
        var obj={
        	vec3s:args,
        	specification:specification,
        	type:type
        };
        mContainer[modelGuid]=obj;
        if(specification.indexOf("X")==-1){
        	var radius=0.0005*parseFloat(specification);
        	mModelObj = terrain.GenerateRoundTunnel(modelGuid,name, args,radius, 24, sideTexturePath);
        }else if(specification.indexOf("X")>-1){
        	var width=specification.split("X")[0];
        	width=0.001 * parseFloat(width);
        	var height=specification.split("X")[1];
        	height=0.001 * parseFloat(height);
        	mModelObj = terrain.GenerateTunnel(modelGuid,name, args, width,height,sideTexturePath);
        }
        mModelObj.SetKey(name);
    	earth.AttachObject(mModelObj);
    	return mModelObj;
    };

    /**
     * 获取本系统根目录
     * @return {[string]} [本系统根目录]
     */
    function getSystemPath() {
        var url = window.location.href;
        url = url.substring(0,url.lastIndexOf('/'));
        url = url.substring(0,url.lastIndexOf('/'));
        url = url.substring(0,url.lastIndexOf('/'));
        return url;
    }

    /**
     * 根据管线GUID找到管线模型对象
     * @param  {[type]} guid [description]
     * @return {[type]}      [description]
     */
    var getPipeLineInfoByGuid = function(guid){
    	for ( var key in mContainer) {
			if(key==guid){
				return mContainer[key];
			}
		}
    };
    UserDataAnalysis.createPipeLine=createPipeLine;
    UserDataAnalysis.getPipeLineInfoByGuid=getPipeLineInfoByGuid;
});