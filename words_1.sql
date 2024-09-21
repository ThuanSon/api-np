-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 06, 2024 at 10:49 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `np`
--

-- --------------------------------------------------------

--
-- Table structure for table `words`
--

CREATE TABLE `words` (
  `id` int(11) NOT NULL,
  `word` varchar(150) NOT NULL,
  `type` varchar(50) DEFAULT NULL,
  `expandType` varchar(50) DEFAULT NULL,
  `kind` varchar(10) DEFAULT NULL,
  `position` int(11) NOT NULL DEFAULT 100,
  `status` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `words`
--

INSERT INTO `words` (`id`, `word`, `type`, `expandType`, `kind`, `position`, `status`) VALUES
(1, 'beautiful', 'adjective', '', 'opinion', 1, 0),
(2, 'flower', 'noun', NULL, NULL, 100, 0),
(3, 'a', 'article', 'DET', NULL, 100, 0),
(4, 'an', 'article', 'DET', NULL, 100, 0),
(6, 'the', 'article', 'DET', NULL, 100, 0),
(9, 'this', 'DEM', 'DET', NULL, 100, 0),
(10, 'that', 'DEM', 'DET', NULL, 100, 0),
(11, 'these', 'DEM', 'DET', NULL, 100, 0),
(12, 'those', 'DEM', 'DET', NULL, 100, 0),
(13, 'some', 'QUANTIFIER', 'DET', NULL, 100, 0),
(14, 'any', 'QUANTIFIER', 'DET', NULL, 100, 0),
(15, 'no', 'QUANTIFIER', 'DET', NULL, 100, 0),
(16, 'each', 'QUANTIFIER', 'DET', NULL, 100, 0),
(17, 'every', 'QUANTIFIER', 'DET', NULL, 100, 0),
(18, 'either', 'QUANTIFIER', 'DET', NULL, 100, 0),
(19, 'neither', 'QUANTIFIER', 'DET', NULL, 100, 0),
(20, 'nor', 'QUANTIFIER', 'DET', NULL, 100, 0),
(21, 'a few', 'QUANTIFIER', 'DET', NULL, 100, 0),
(22, 'a little', 'QUANTIFIER', 'DET', NULL, 100, 0),
(23, 'my', 'POSSESSIVE', 'DET', NULL, 100, 0),
(24, 'your', 'POSSESSIVE', 'DET', NULL, 100, 0),
(25, 'its', 'POSSESSIVE', 'DET', NULL, 100, 0),
(26, 'her', 'POSSESSIVE', 'DET', NULL, 100, 0),
(27, 'his', 'POSSESSIVE', 'DET', NULL, 100, 0),
(28, 'their', 'POSSESSIVE', 'DET', NULL, 100, 0),
(29, 'all', 'PRE-DET', 'PREDET', NULL, 100, 0),
(30, 'half', 'PRE-DET', 'PREDET', NULL, 100, 0),
(31, 'both', 'PRE-DET', 'PREDET', NULL, 100, 0),
(32, 'double', 'PRE-DET', 'PREDET', NULL, 100, 0),
(33, 'very', 'adverb', 'DEG', NULL, 100, 0),
(34, 'so', 'adverb', 'DEG', NULL, 100, 0),
(35, 'too', 'adverb', 'DEG', NULL, 100, 0);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `words`
--
ALTER TABLE `words`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `words`
--
ALTER TABLE `words`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
