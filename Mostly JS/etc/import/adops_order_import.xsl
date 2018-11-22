<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:data="data:data" version="1.0" exclude-result-prefixes="data">
   <xsl:output method="xml" indent="yes" />

   <xsl:template match="@*|node()">
      <xsl:copy>
         <xsl:apply-templates select="@*|node()" />
      </xsl:copy>
   </xsl:template>

   <xsl:param name="isUpdate" select="//DataElement[Name = 'Update']/Value" />
   <xsl:variable name="sDate" select="//DataElement[Name = 'StartDate']/Value" />
 
    <xsl:template match="Placing">
       <Placing>
          <xsl:if test="string($isUpdate)!='true'"> 
                <StartDate>
                    <xsl:value-of select="$sDate"/>
                </StartDate>
          </xsl:if> 
          <EndDate>9999-12-31T23:00:00.000</EndDate>  
          <StateMachine>Ad Ops Distribution State Machine</StateMachine>
        <StateName>Not available</StateName>
            <UserName>wsuser</UserName>
        <Owner>
            <Name>Ad Ops</Name>
        </Owner>
        <PlacingPublicationList>
            <PlacingPublication>
                <PublicationDefinition>
                    <Name>VAST_default</Name>
                </PublicationDefinition>
            </PlacingPublication>
        </PlacingPublicationList>
        <xsl:apply-templates select="@* | *" />
        </Placing>
     </xsl:template>
     <xsl:template match="DataElement[Name = 'Update']" />
</xsl:stylesheet>