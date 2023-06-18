      const jf_logging_columns = [
        "Id",
        "Name",
        "Type",
        "ExecutionType",
        "Duration",
        "TimeRun",
        "Log",
        "Result"
      ];

      const jf_logging_mapping = (item) => ({
        Id: item.Id,
        Name: item.Name,
        Type: item.Type,
        ExecutionType: item.ExecutionType,
        Duration: item.Duration,
        TimeRun: item.TimeRun,
        Log: item.Log,
        Result: item.Result,
      });

  module.exports = {
    jf_logging_columns,
    jf_logging_mapping,
  };