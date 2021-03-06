/**
 * 作    者：StampGIS Team
 * 创建日期：2017年6月15日
 * 描    述：管线字段值域表-部分属性
 * 注意事项：专门为管线的部分属性设置的一个值域映射表
 * 遗留bug ：无
 * 修改日期：2017年11月9日
 */
var FieldValueStringMap={};
(function () {
    /**
     * 根据材质编码获取显示值
     * @param {[type]} matCode [description]
     */
     var GetMaterialString=function(matCode){
         switch (matCode){
             // 普通点
             case 0:
                 return "铸铁";
             case 1:
                 return "球墨铸铁";
             case 2:
                 return "砼";
             case 3:
                 return "钢";
             case 4:
                 return "玻璃钢";
             case 5:
                 return "PVC";
             case 6:
                 return "陶瓷";
             case 7:
                 return "砖";
             case 8:
                 return "铜";
             case 9:
                 return "光纤";
             case 0xffff:
                 return "未知";
             default:
                 return matCode.toString();
         }
     };

     /**
      * 点性质代码对应字符串
      * @param {[type]} pntCode [description]
      */
     var GetPointTypeString = function(pntCode){
         switch (pntCode){
             // 普通点
             case 0x0000:
                 return "普通点标记";
             case 0x0001:
                 return "非普查";
             case 0x0002:
                 return "预留口";
             case 0x0003:
                 return "直线点";
             case 0x0004:
                 return "转折点";
             case 0x0005:
                 return "分支点";
             case 0x0006:
                 return "变径点";
             case 0x0007:
                 return "变深点";
             case 0x0008:
                 return "盖堵";
             case 0x0009:
                 return "源点";
             case 0x000A:
                 return "进水口";
             case 0x000B:
                 return "出水口";

             // 连接点
             case 0x1000:
                 return "连接点标记";
             case 0x1001:
                 return "管帽";
             case 0x1002:
                 return "弯头";
             case 0x1003:
                 return "三通";
             case 0x1004:
                 return "四通";
             case 0x1005:
                 return "五通";

             // 功能设备点
             case 0x2000:
                 return "设备点标记";
             case 0x2001:
                 return "上杆";
             case 0x2002:
                 return "接线箱";
             case 0x2003:
                 return "化粪池";
             case 0x2004:
                 return "阀门";
             case 0x2005:
                 return "水表";
             case 0x2006:
                 return "消防栓";
             case 0x2007:
                 return "凝水缸";
             case 0x2008:
                 return "调压箱";
             default:
                 return pntCode.toString();
         }
     };

     /**
      * 埋设类型对应字符串
      * @param {[type]} covCode [description]
      */
     var GetCoverageTypeString=function(covCode){
         switch(covCode){
             case 0:
                 return "直埋";
             case 1:
                 return "管埋";
             case 2:
                 return "管块";
             case 3:
                 return "沟道";
             case 4:
                 return "架空";
             default:
                 return covCode.toString();
         }
     };

     /**
      * 流向对应字符串
      * @param {[type]} dirCode [description]
      */
     var GetFlowDirString=function(dirCode){
         switch(dirCode){
             case 1:
                 return "起点到终点";
             case 2:
                 return "终点到起点";
             case 3:
                 return "双向";
             default:
                 return "未知";
         }
     };

     /**
      * 井形状对应字符串
      * @param {[type]} wellCode [description]
      */
     var GetWellTypeString=function(wellCode){
         switch(wellCode){
             case 0:
                 return "无井";
             case 1:
                 return "圆井";
             case 2:
                 return "方井";
             case 3:
                 return "雨水篦子";
             case 4:
                 return "手孔";
             default:
                 return wellCode.toString();
         }
     };

     /**
      * 字段值对应中文字符串 --- 废弃字段待处理
      * @param {[type]} nameCode  [标准字段]
      * @param {[type]} valueCode [值]
      */
     var GetFieldValueString=function(nameCode, valueCode){   
         var value = parseInt(valueCode);
         switch (nameCode){
             case "US_LTTYPE":
            	 return FieldValueStringMap.GetCoverageTypeString(value);
             case "US_FLOWDIR":
                 return FieldValueStringMap.GetFlowDirString(value);
             case "US_PMATER":
                 return FieldValueStringMap.GetMaterialString(value);
             case "US_PT_TYPE":
                 return FieldValueStringMap.GetPointTypeString(value);
             case "US_WELL":
                 return FieldValueStringMap.GetWellTypeString(value);
             default:
                 return valueCode;
         }
     };
     FieldValueStringMap.GetCoverageTypeString=GetCoverageTypeString;
     FieldValueStringMap.GetWellTypeString=GetWellTypeString;
     FieldValueStringMap.GetFlowDirString=GetFlowDirString;
     FieldValueStringMap.GetMaterialString=GetMaterialString;
     FieldValueStringMap.GetPointTypeString=GetPointTypeString;
     FieldValueStringMap.GetFieldValueString=GetFieldValueString;
})();
