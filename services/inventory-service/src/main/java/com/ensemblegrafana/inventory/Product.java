package com.ensemblegrafana.inventory;

import java.math.BigDecimal;
import java.util.List;

public record Product(
    String id,
    String name,
    String department,
    String category,
    BigDecimal originalPrice,
    BigDecimal price,
    List<String> colors,
    List<String> sizes,
    String badge,
    double rating,
    int stock,
    String image) {
}
