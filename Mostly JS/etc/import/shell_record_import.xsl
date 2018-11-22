<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:output method="xml" indent="yes" />
    <xsl:template match="@*|node()">
        <xsl:copy>
            <xsl:apply-templates select="@*|node()" />
        </xsl:copy>
    </xsl:template>
    <xsl:template match="Material">
        <Material>
            <Owner>
                <Name>NBCU GMO</Name>
            </Owner>
            <FrameRate>P23_976</FrameRate>
            <Duration>00:00:00:00</Duration>
            <TrackTypeLink>
                <TrackTypeName>Video</TrackTypeName>
                <StateMachine>NBC GMO</StateMachine>
                <StateName>Not available</StateName>
            </TrackTypeLink>
            <xsl:apply-templates select="@* | *" />
        </Material>
    </xsl:template>
    <xsl:template match="Material/DataElementList">
        <DataElementList>
			<!--
				Commenting Out - Translator is going to send this from now onwards 
				Mediator is going to create this for Versions    
				<DataElement>
					<Name>Shell Creator</Name>
					<Type>set</Type>
					<Value>Translation Layer</Value>
				</DataElement>
			-->
            <xsl:apply-templates select="@* | *" />
        </DataElementList>
    </xsl:template>
</xsl:stylesheet>
