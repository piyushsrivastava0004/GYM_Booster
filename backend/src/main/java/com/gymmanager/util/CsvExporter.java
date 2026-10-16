package com.gymmanager.util;

import com.opencsv.CSVWriter;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
public class CsvExporter {

    public byte[] exportToCsv(String[] headers, List<String[]> dataRows) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream();
             OutputStreamWriter writer = new OutputStreamWriter(out, StandardCharsets.UTF_8);
             CSVWriter csvWriter = new CSVWriter(writer)) {

            csvWriter.writeNext(headers);
            for (String[] row : dataRows) {
                csvWriter.writeNext(row);
            }
            csvWriter.flush();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error exporting to CSV: " + e.getMessage(), e);
        }
    }
}
