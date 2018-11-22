<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" 
 xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
 xmlns:tt="http://www.w3.org/ns/ttml"
 extension-element-prefixes="tt"
 exclude-result-prefixes="tt">

 <xsl:output indent="yes" method="xml" encoding="UTF-8"/>

 <xsl:param name="matId"/>
 <xsl:param name="ttlName"/>
 <xsl:param name="frameRate"/>

 <xsl:template match="tt:tt">
  <Pharos>
   <Material>
    <MatId>
     <xsl:value-of select="$matId"/>
    </MatId>
    <FrameRate>
     <xsl:value-of select="$frameRate"/>
    </FrameRate>
    <TrackTypeLink>
     <TrackTypeName>
      <xsl:value-of select="$ttlName"/>
     </TrackTypeName>
     <xsl:apply-templates select="tt:body/tt:div/tt:p"/>
    </TrackTypeLink>
   </Material>
  </Pharos>
 </xsl:template>

 <xsl:template match="tt:body/tt:div/tt:p">
  <Comment>
   <FrameRate>
    <xsl:value-of select="$frameRate"/>
   </FrameRate>
   <AbsoluteStartTc rate="{$frameRate}">
    <xsl:value-of select="./@begin"/>
   </AbsoluteStartTc>
   <AbsoluteEndTc rate="{$frameRate}">
    <xsl:value-of select="./@end"/>
   </AbsoluteEndTc>
   <CommentTypeName>SUBTITLE</CommentTypeName>
   <Detail>
    <xsl:value-of select="."/>
   </Detail>
  </Comment>
 </xsl:template>
</xsl:stylesheet>
  