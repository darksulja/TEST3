<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:data="data:data" version="1.0" exclude-result-prefixes="data">
   <xsl:output method="xml" indent="yes" />
  
   <!-- Export Format Data Table -->
   <data:ExportFormats>
      <ExportFormat name="US TV - iTunes OTTO GMO Direct Pub -GMO" language="ENG" region="US" />
      <ExportFormat name="AU TV  - iTunes –GMO" language="ENG" region="AU" />
      <ExportFormat name="CA TV - iTunes OTTO GMO Direct Pub –GMO" language="ENG" region="CA" />
      <ExportFormat name="UK TV  - iTunes -GMO" language="ENG" region="UK" />
      <ExportFormat name="FR TV (DUB) - iTunes - CC" language="FR" region="UK" />
   </data:ExportFormats>
  
   <xsl:template match="@*|node()">
      <xsl:copy>
         <xsl:apply-templates select="@*|node()" />
      </xsl:copy>
   </xsl:template>

   <xsl:variable name ="inDate" select="//DataElement[Name = 'Due Date']/Value" />
   <xsl:variable name="date" select="translate($inDate,' ','T')"/>
    <xsl:variable name="dueDate">
        <xsl:call-template name="getDueDate">
          <xsl:with-param name="startDate" select="'9999-01-01T00:00:00.000'" />
        </xsl:call-template>
    </xsl:variable>
    
   <xsl:variable name="exportFormats" select="document('')//data:ExportFormats" />
   <xsl:variable name="exportFormat" select="//DataElement[Name = 'Export Format']/Value" />
   <xsl:key name="export-lookup" match="data:ExportFormats/ExportFormat" use="@name" />
   <xsl:param name="isUpdate" select="//DataElement[Name = 'Update']/Value" />
   
   <xsl:template match="Placing">
      <Placing>
       	<xsl:if test="not((string($date)='') and (string($isUpdate)='true'))"> 
			<StartDate>
				<xsl:value-of select="$dueDate"/>
			</StartDate>
		</xsl:if> 
         <EndDate>9999-12-31T23:00:00.000</EndDate>
         <StateMachine>Content Distribution</StateMachine>
         <StateName>Not available</StateName>
         <UserName>wsuser</UserName>
         <Owner>
            <Name>NBCU GMO</Name>
         </Owner>
         <xsl:if test="(not(PlacingPublicationList)) and (string($isUpdate)!='true')">
            <PlacingPublicationList>
               <PlacingPublication>
                  <PublicationDefinition>
                     <Name>Blank</Name>
                  </PublicationDefinition>
               </PlacingPublication>
            </PlacingPublicationList>
         </xsl:if>
         <xsl:apply-templates select="@* | *" />
      </Placing>
   </xsl:template>
   
   <xsl:template name="getDueDate">
        <xsl:param name="startDate" />
        <xsl:choose>
            <xsl:when test="string($date) != ''">
                <!--<xsl:value-of select="concat(substring-before($date,'12:00:00'),'23:59:59.999')"/>-->
        <xsl:value-of select="$date"/>
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="$startDate"/>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>

   <!-- Deleting Update Data Element - This is just to Skip the Pub Def Addition in to PXF-->
   <xsl:template match="DataElement[Name = 'Update']" />
  
   <!-- Adding Region & Language Data Element using Export Format Name Lookup -->
   <xsl:template match="DataElement[Name = 'Export Format']">
      <DataElement>
         <Name>Export Format</Name>
         <Type>shorttext</Type>
         <Value>
            <xsl:value-of select="$exportFormat" />
         </Value>
      </DataElement>
      <DataElement>
         <Name>Region</Name>
         <Type>shorttext</Type>
         <Value>
            <xsl:for-each select="$exportFormats">
               <xsl:value-of select="key('export-lookup', $exportFormat)/@region" />
            </xsl:for-each>
         </Value>
      </DataElement>
      <DataElement>
         <Name>Language</Name>
         <Type>shorttext</Type>
         <Value>
            <xsl:for-each select="$exportFormats">
               <xsl:value-of select="key('export-lookup', $exportFormat)/@language" />
            </xsl:for-each>
         </Value>
      </DataElement>
   </xsl:template>
</xsl:stylesheet>
