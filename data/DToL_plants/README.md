# Notes

## DToL priorites

To make the DToL priority list, I concantenated these files:

`cat DToLsp_priorities_collection_merged_bryophytes.csv DToLsp_priorities_collection_merged_ferns_angiosperms.csv > DToL_priorities.cs`

## Genome size data

The genome size data has no 'id' column present in the DToL plant collections data sheet. Instead, there is 'ID number' in the bryophyte sheet, corresponding I think to the 'collector_number' in the DToL sheet. However, these names are inconsistent betweeen the sheets.

- What is the 'id' column? Is this number issued out? If so, by whom?

- Currently the collection ID number is:
  - Initals + running number
- Potentially change to:
  - First initial + number + second initial + running number (e.g M1BXXXX, A1TXXXX)
  - This will eliminate duplicate entries